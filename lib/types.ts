export type UserRole = "admin" | "staff" | "client"

export type CaseStatus = "pending" | "in_progress" | "under_review" | "approved" | "rejected" | "completed"

export type CaseType = "family" | "employment" | "asylum" | "citizenship" | "visa" | "green_card" | "other"

export type PriorityLevel = "low" | "medium" | "high" | "urgent"

export type DocumentStatus = "pending" | "submitted" | "approved" | "rejected" | "requires_action"

export type MessageStatus = "sent" | "delivered" | "read"

export interface User {
  id: string
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
}

export interface Client {
  id: number
  user_id: string
  case_count: number
  assigned_staff_id?: string
  notes?: string
  created_at: string
  updated_at: string
  user?: User
  assigned_staff?: User
}

export interface Case {
  id: number
  case_number: string
  client_id: string
  assigned_staff_id?: string
  case_type: CaseType
  status: CaseStatus
  priority: PriorityLevel
  title: string
  description?: string
  filing_date?: string
  deadline_date?: string
  completion_date?: string
  progress_percentage: number
  google_drive_folder_id?: string
  created_at: string
  updated_at: string
  client?: User
  assigned_staff?: User
  milestones?: CaseMilestone[]
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
  created_at: string
}

export interface Document {
  id: number
  case_id: number
  uploaded_by: string
  name: string
  description?: string
  file_url: string
  file_size?: number
  mime_type?: string
  status: DocumentStatus
  google_drive_file_id?: string
  is_required: boolean
  category?: string
  created_at: string
  updated_at: string
  uploader?: User
}

export interface Message {
  id: number
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
  user_id?: string
  case_id?: number
  action: string
  description?: string
  metadata?: Record<string, any>
  created_at: string
  user?: User
}
