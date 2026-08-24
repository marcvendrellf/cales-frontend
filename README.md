<h1 align="center">Calés · An Explainable Agentic Procurement System</h1>

<p align="center">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-backend-009688?logo=fastapi&logoColor=white" />
  <img alt="MapLibre" src="https://img.shields.io/badge/MapLibre-GL-396CB2?logo=maplibre&logoColor=white" />
</p>

<p align="center"><strong>Building AI-assisted decision support a buyer can audit.</strong></p>

<p align="center">
  <a href="DEMO_LINK_TO_BE_ADDED">Live demo</a> ·
  <a href="https://github.com/josep-audenis/cales-backend">Backend repository</a>
</p>

<p align="center"><em>Temporary README option. One of three drafts in <code>readme-options/</code>, not the final repository README.</em></p>

---

## The problem

Calés was built for Damm's procurement team during the EHub × Damm hackathon. The brief supplied weekly observations for one commodity from 2006 to 2025, with a hidden 26-week forecast horizon, and asked for a forecasting or logistics solution.

Damm's procurement team have four options for every commodity **buy now, wait, hedge exposure, or monitor?** The tool is built to help them decide with evidence they can audit. All decisions are auditable: Damm's team can see the news and data the agent team consulted.

## Architecture

```text
                  ┌──────────────────────┐
                  │  React / Vite cockpit │
                  │  charts · reports    │
                  │  scenarios · agents  │
                  └──────────┬───────────┘
                             │ API contract
                  ┌──────────▼───────────┐
                  │   FastAPI backend    │
                  │ data · forecasts     │
                  │ decisions · reports  │
                  └──────────┬───────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   Historical data      Cala signals       Five-agent crew
```

The frontend is the interface for the user. The backend owns the data contract, the deterministic calculation layer, the report schema, executive PDF output, and agent orchestration. It can be found here: [github.com/josep-audenis/cales-backend](https://github.com/josep-audenis/cales-backend).

The boundary between them is a typed report contract, so the shape of a report is enforced on both sides instead of being reconstructed in the UI. This consistency helped us avoid problems in the demo!

## Five-agent orchestration

A single general-purpose agent asked to produce a whole recommendation will hallucinate the parts it cannot compute. Splitting the pipeline into five roles with narrow contracts removes most of that surface:

| Stage | Agent | Output |
| --- | --- | --- |
| 1 | **Fundamentals Agent** | Price features, momentum, and seasonality signals. |
| 2 | **Cala Signal Agent** | External evidence about producers, disruptions, and weather. |
| 3 | **Forecast Agent** | Base, upside, and downside forecast corridor. |
| 4 | **Decision Agent** | Buy, wait, hedge, or monitor action with scores and confidence. |
| 5 | **Explanation Agent** | Evidence-linked narrative and monitoring conditions. |

The orchestrator owns sequencing and the JSON handoffs between stages. Signal gathering is independent and runs in parallel; forecasting, decision, and explanation are strictly sequential because each consumes the previous stage's output. Every numeric result comes from a deterministic tool, so the language model's job is interpretation and phrasing, not arithmetic.

## Explainability by design

Explainability here is a schema property, not a post-processing step. Reports preserve the full chain:

```text
source → evidence → signal → driver → scenario → recommendation
```

Because that chain is in the contract, the interface can render every link of it: forecast corridor, risk and opportunity scores, driver direction, source reliability, evidence references, historical context, affected locations, and the conditions that would invalidate the recommendation. A what-if panel adjusts driver intensity and recomputes the action live, which turns the report from a static artefact into something a buyer can stress-test.

## Frontend

The React application is organised around the decision flow: a command centre for relative trends, warehouse fill, and market news; material workspaces holding price history and driver analysis; a report builder with selectable context and evidence; and a chapter-based viewer with maps and evidence references.

The interesting piece is the screen-aware agent. It reasons over the controls actually rendered on the report-builder page and can explain or update them, so a natural-language request resolves against real interface state instead of returning instructions the user then has to follow by hand.

## Technology

- **Frontend:** React 19, TypeScript, Vite, React Router, Tailwind CSS, Radix UI
- **Data:** TanStack Query, typed API client, local fixtures, structured report contracts
- **Charts and maps:** Recharts, lightweight-charts, MapLibre GL
- **Backend:** FastAPI, Pydantic schemas, deterministic forecasting and decision services
- **Agent system:** five-agent orchestration, Cala tools, guardrails, structured handoffs
- **Output:** website report JSON, public report routes, and executive PDF reports

## Demo status

**Live demo:** deployment in progress, link to be added.

> **Screenshot placeholder**
>
> Add screenshots of the command centre, material workspace, report builder, and report viewer after deployment.

The deployed demo follows the happy path on deterministic fixture data. There are no live external APIs, production Cala access, API keys, or real report generation. It demonstrates the complete product flow while keeping the architecture and interactions built for the project intact.

## Recognition

Calés won the **overall EHub × Damm hackathon prize** and the **Best Use of Cala award**.

Built by **Josep Audenis, Marc Vendrell, and Guillem Cadevall**, at an event supported by Damm, Deleito, Opereit, Cala, The AI Collective, and the Engineering Hub team.
