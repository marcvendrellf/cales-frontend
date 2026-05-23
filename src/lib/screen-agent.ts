export const SCREEN_AGENT_ASK_EVENT = "cales:screen-agent-ask"

export type ScreenAgentResult = {
  message?: string
}

export type ScreenAgentAskDetail = {
  prompt: string
  handled: boolean
  response?: Promise<ScreenAgentResult>
}

export function askActiveScreen(prompt: string): Promise<ScreenAgentResult> | null {
  const detail: ScreenAgentAskDetail = { prompt, handled: false }
  window.dispatchEvent(new CustomEvent<ScreenAgentAskDetail>(SCREEN_AGENT_ASK_EVENT, { detail }))
  return detail.handled ? detail.response ?? Promise.resolve({} as ScreenAgentResult) : null
}
