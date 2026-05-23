import type { CommodityId } from "@/types"

export type UIAgentActionType = "click" | "toggle_on" | "toggle_off" | "select"
export type UIAgentControlType = "checkbox" | "button" | "tab" | "input"

export interface UIAgentControl {
  target_id: string
  label: string
  type: UIAgentControlType
  selected?: boolean
  disabled?: boolean
  value?: string | boolean | number | null
  metadata?: Record<string, unknown>
}

export interface UIScreenPayload {
  prompt: string
  page_id: string
  route: string
  material?: CommodityId
  screen_state: Record<string, unknown>
  visible_controls: UIAgentControl[]
}

export interface UIAgentAction {
  type: UIAgentActionType
  target_id: string
  reason: string
  value?: string | boolean | number | null
}

export interface UIAgentResponse {
  explanation: string
  actions: UIAgentAction[]
  requires_confirmation: boolean
}
