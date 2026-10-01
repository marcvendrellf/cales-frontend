"""Bundle public-domain Natural Earth countries in Web Mercator coordinates."""
import json
import math
from pathlib import Path
from urllib.request import urlopen

SOURCE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"


def project(coordinates):
    lng, lat = coordinates[:2]
    sine = math.sin(math.radians(max(-85.05112878, min(85.05112878, lat))))
    return [(lng + 180) / 360 * 256, (0.5 - math.log((1 + sine) / (1 - sine)) / (4 * math.pi)) * 256]


with urlopen(SOURCE) as response:
    features = json.load(response)["features"]
countries = []
for feature in features:
    geometry, properties = feature["geometry"], feature["properties"]
    polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
    rings = [[project(point) for point in ring] for polygon in polygons for ring in polygon]
    path = "".join("M" + "L".join(f"{x:.3f},{y:.3f}" for x, y in ring) + "Z" for ring in rings)
    points = [point for ring in rings for point in ring]
    countries.append({
        "name": properties["NAME_EN"],
        "path": path,
        "label": [round(value, 3) for value in project([properties["LABEL_X"], properties["LABEL_Y"]])],
        "width": round(max(p[0] for p in points) - min(p[0] for p in points), 3),
        "height": round(max(p[1] for p in points) - min(p[1] for p in points), 3),
    })
output = Path(__file__).resolve().parents[1] / "src/data/fallback-map.json"
output.write_text(json.dumps({"source": SOURCE, "license": "Public domain, https://www.naturalearthdata.com/about/terms-of-use/", "countries": countries}, separators=(",", ":")) + "\n")
print(f"Bundled {len(countries)} countries, {output.stat().st_size} bytes")
