# Procurement decisions for raw materials

We built a five-agent procurement tool to help buyers decide whether to buy, wait, hedge or monitor raw materials. We called it Calés, and it won the overall prize and Best Use of Cala at the Damm x Engineering Hub Hackathon.

The application brings price history, inventory levels and external market evidence into one workspace. Buyers can inspect the reasons behind a recommendation and explore how a different scenario would change it.

[Try the demo](https://cales.marcvendrell.cat) · [Backend repository](https://github.com/josep-audenis/cales-backend)

## What we built

Damm supplied weekly price data for one commodity from 2006 to 2025 and a 26-week forecast horizon. We used that brief to build a tool for procurement decisions, with workspaces for aluminium, PET, energy and barley.

The dashboard shows price trends, warehouse levels and market news. Each material has its own workspace with historical prices, market drivers and a recommendation. A report builder lets the buyer choose the context and evidence to include in an analysis.

Reports show an action, a time horizon, confidence, forecast scenarios and the evidence behind the result. What-if controls let buyers adjust market drivers and see how the recommendation changes. The report builder also has an assistant that reads the visible controls and can propose changes to the selected inputs.

## How the workflow works

The backend separates the analysis into five roles.

| Role | Responsibility |
| --- | --- |
| Fundamentals | Calculates price momentum and seasonal signals from historical data. |
| Cala signals | Collects evidence about producers, supply disruptions and weather through Cala. |
| Forecast | Builds a forecast range and alternative price scenarios. |
| Decision | Produces a buy, wait, hedge or monitor recommendation with risk and confidence scores. |
| Explanation | Writes the explanation and identifies evidence and conditions to monitor. |

The five-agent design uses structured handoffs between stages. In the current backend, deterministic tools collect signals, calculate forecasts and score decisions. The language model writes the explanation from those results.

The React frontend and FastAPI backend share a typed report structure. Each report connects sources to evidence, market drivers, scenarios and a recommendation, so buyers can follow the reasoning in the interface. API requests have timeouts, and the interface shows loading and error states.

## Demo

The [deployed demo](https://cales.marcvendrell.cat) uses fixture data and saved reports. It lets you explore the dashboard, material workspaces, report viewer and scenario controls. Live report generation and live Cala queries are disabled in this version.

## Technology

The frontend uses React 19, TypeScript, Vite, React Router, Tailwind CSS and Radix UI. TanStack Query handles data fetching, Recharts and lightweight-charts draw the charts, and MapLibre GL renders the maps.

The backend uses Python, FastAPI, Pydantic and the OpenAI Agents SDK. It handles market signals, forecasting, decision scoring, structured reports and executive PDF output. This repository contains the frontend.

## Run locally

```bash
npm install
npm run dev
```

Without API configuration, the application uses the mock data in `src/data/mock.ts`. To connect a local backend, copy `.env.example` to `.env.local` and set these values.

```dotenv
VITE_API_URL=http://localhost:8000
VITE_AGENT_API_URL=http://localhost:8000
VITE_UI_AGENT_API_URL=http://localhost:8000
```

`VITE_UI_AGENT_API_URL` is optional. If you omit it, the interface assistant uses `VITE_AGENT_API_URL` and calls `/agent/ui`.

Run the lint and production build checks with these commands.

```bash
npm run lint
npm run build
```

## Team

Built by Josep Audenis, Marc Vendrell and Guillem Cadevall.
