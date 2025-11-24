export type UserRole = "admin" | "staff" | "client"

export type CaseStatus = "pending" | "in_progress" | "under_review" | "approved" | "rejected" | "completed"

export type CaseLifecycleStatus = "preparation" | "submitted" | "resolution" | "completed"
export type CaseStageStatus = "pending" | "in_progress" | "completed" | "blocked"

export type CaseType = "family" | "employment" | "asylum" | "citizenship" | "visa" | "green_card" | "other"

export type PriorityLevel = "low" | "medium" | "high" | "urgent"

export type DocumentStatus = "pending" | "submitted" | "approved" | "rejected" | "requires_action" | "not_required"

export type MessageStatus = "sent" | "delivered" | "read"

export interface BrandingPalette {
  primary: string
  primaryForeground: string
  background: string
  foreground: string
  accent: string
  accentForeground: string
  muted: string
  mutedForeground: string
  border: string
  card: string
  cardForeground: string
  sidebar: string
  sidebarForeground: string
}

export interface BrandingTypography {
  fontSans: string
  fontHeading: string
}

export interface BrandingSettings {
  logo_url?: string | null
  logo_path?: string | null
  palette?: Partial<BrandingPalette>
  typography?: Partial<BrandingTypography>
}

export interface Organization {
  id: string
  name: string
  slug: string
  domain?: string | null
  logo_url?: string | null
  support_email?: string | null
  branding?: BrandingSettings
}

export interface User {
  id: string
  organization_id: string
  email: string
  name: string
  role: UserRole
  phone?: string
  address?: string
  date_of_birth?: string
  country_of_origin?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  organization?: Organization | null
}

export interface Client {
  id: number
  organization_id: string
  user_id: string
  case_count: number
  assigned_staff_id?: string
  notes?: string
  archived_at?: string
  created_at: string
  updated_at: string
  user?: User
  assigned_staff?: User
}

export interface Case {
  id: number
  organization_id: string
  case_number: string
  client_id: string
  assigned_staff_id?: string
  case_type_template_id?: string
  case_type: CaseType
  status: CaseStatus
  lifecycle_status: CaseLifecycleStatus
  priority: PriorityLevel
  title: string
  description?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  internal_notes?: string
  filing_date?: string
  deadline_date?: string
  completion_date?: string
  progress_percentage: number
  created_at: string
  updated_at: string
  client?: User
  assigned_staff?: User
  milestones?: CaseMilestone[]
  events?: CaseEvent[]
  contacts?: CaseContact[]
  key_dates?: CaseKeyDate[]
}

export interface CaseMilestone {
  id: number
  case_id: number
  title: string
  description?: string
  due_date?: string
  completed: boolean
  completed_at?: string
  order_index: number
  status: CaseStageStatus
  assigned_staff_id?: string
  required_documents?: any
  subtasks?: any
  notes?: string
  created_at: string
}

export interface CaseEvent {
  id: number
  case_id: number
  type: string
  title: string
  description?: string
  occurred_at: string
  created_by?: string
  author_name?: string
  attachments?: any
  metadata?: any
  created_at: string
}

export interface Document {
  id: number
  organization_id: string
  case_id: number
  uploaded_by?: string | null
  name: string
  description?: string
  storage_path?: string | null
  file_url?: string | null
  file_size?: number
  mime_type?: string
  status: DocumentStatus
  is_required: boolean
  category?: string
  created_at: string
  updated_at: string
  uploader?: User
}

export interface Message {
  id: number
  organization_id: string
  case_id: number
  sender_id: string
  receiver_id: string
  subject?: string
  content: string
  status: MessageStatus
  read_at?: string
  created_at: string
  sender?: User
  receiver?: User
}

export interface Notification {
  id: number
  organization_id: string
  user_id: string
  title: string
  message: string
  type?: string
  related_case_id?: number
  is_read: boolean
  created_at: string
}

export interface ActivityLog {
  id: number
  organization_id: string
  user_id?: string
  case_id?: number
  action: string
  description?: string
  metadata?: Record<string, any>
  created_at: string
  user?: User
}

export interface CaseContact {
  id: number
  organization_id: string
  case_id: number
  full_name: string
  email?: string
  phone?: string
  role?: string
  organization_name?: string
  notes?: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface CaseKeyDateReminder {
  id: number
  organization_id: string
  key_date_id: number
  case_id: number
  send_at: string
  status: "scheduled" | "sent" | "failed"
  send_to?: { email: string; name?: string }[]
  subject: string
  body?: string
  sent_at?: string
  provider_message_id?: string
  last_error?: string
  created_at: string
  updated_at: string
}

export interface CaseKeyDate {
  id: number
  organization_id: string
  case_id: number
  title: string
  description?: string
  type?: string
  occurs_at: string
  timezone?: string
  duration_minutes?: number
  location?: string
  sync_to_calendar: boolean
  google_calendar_event_id?: string
  google_calendar_html_link?: string
  notify_by_email: boolean
  notify_emails?: { email: string; name?: string }[]
  remind_minutes_before?: number
  email_subject?: string
  email_body?: string
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
  reminder?: CaseKeyDateReminder | null
}
