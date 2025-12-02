export type Plan = "free" | "starter" | "professional" | "enterprise"
export type TenantStatus = "active" | "suspended" | "cancelled"
export type UserRole = "super_admin" | "admin" | "agent"
export type PipelineStage = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost"
export type MessageType = "text" | "image" | "audio" | "video" | "document"
export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed"
export type SessionStatus = "connected" | "disconnected" | "qr_pending" | "connecting"
export type FlowTriggerType = "keyword" | "always" | "schedule" | "pipeline_stage"

export interface Tenant {
  id: string
  name: string
  email: string
  plan: Plan
  status: TenantStatus
  whatsapp_sessions_limit: number
  users_limit: number
  contacts_limit: number
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  tenant_id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  tenant_id: string
  whatsapp_id: string
  name: string
  phone: string
  email?: string
  avatar_url?: string
  tags: string[]
  pipeline_stage: PipelineStage
  notes?: string
  last_message_at?: string
  assigned_to?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  tenant_id: string
  contact_id: string
  whatsapp_session_id: string
  message_id: string
  from_me: boolean
  type: MessageType
  content?: string
  media_url?: string
  timestamp: string
  status: MessageStatus
  created_at: string
}

export interface WhatsAppSession {
  id: string
  tenant_id: string
  session_name: string
  phone_number?: string
  status: SessionStatus
  qr_code?: string
  last_seen?: string
  session_data?: any
  created_at: string
  updated_at: string
}

export interface ChatbotFlow {
  id: string
  tenant_id: string
  name: string
  description?: string
  trigger_type: FlowTriggerType
  trigger_value?: string
  is_active: boolean
  flow_data: any[]
  created_by?: string
  created_at: string
  updated_at: string
}
