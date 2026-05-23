# Cales Frontend

React/Vite frontend for the Cales procurement intelligence demo.

## Local Run

```bash
npm install
npm run dev
```

By default the app uses `src/data/mock.ts`. To connect it to the backend, copy `.env.example` to `.env.local` and set:

```bash
VITE_API_URL=http://localhost:8000
VITE_AGENT_API_URL=http://localhost:8000
VITE_UI_AGENT_API_URL=http://localhost:8000
```

When `VITE_AGENT_API_URL` is set, the UI cursor agent calls the backend `/agent/ui` endpoint. `VITE_UI_AGENT_API_URL` can override that target with either the backend base URL or the full `/agent/ui` endpoint.

## Validation

```bash
npm run lint
npm run build
```

## Integration Notes

- `POST /agent/analyze` returns the website report JSON plus `executive_pdf`.
- Generated reports use the backend `request_id` as the report route id.
- Public `/r/:reportId` pages first read local storage, then fall back to `GET /agent/reports/:reportId`.
- The Create Report page sends screen state to `/agent/ui` and applies returned cursor actions to controls marked with `data-agent-id`.
