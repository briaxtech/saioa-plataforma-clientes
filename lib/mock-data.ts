// Mock data for demo purposes - replace with real API calls later

export interface Case {
  id: string
  caseNumber: string
  clientName: string
  caseType: string
  status: "active" | "pending" | "review" | "approved" | "rejected" | "closed"
  priority: "high" | "medium" | "low"
  filingDate: string
  nextAction: string
  nextActionDate: string
  progress: number
  assignedTo: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  activeCases: number
  joinDate: string
  status: "active" | "inactive"
}

export interface Document {
  id: string
  name: string
  type: string
  uploadDate: string
  size: string
  status: "approved" | "pending" | "rejected"
  caseId: string
}

export const mockCases: Case[] = [
  {
    id: "1",
    caseNumber: "IMM-2024-001",
    clientName: "Maria Rodriguez",
    caseType: "Family-Based Green Card",
    status: "active",
    priority: "high",
    filingDate: "2024-01-15",
    nextAction: "Submit I-485",
    nextActionDate: "2024-02-01",
    progress: 65,
    assignedTo: "Sarah Johnson",
  },
  {
    id: "2",
    caseNumber: "IMM-2024-002",
    clientName: "John Chen",
    caseType: "H-1B Extension",
    status: "review",
    priority: "medium",
    filingDate: "2024-01-20",
    nextAction: "USCIS Review",
    nextActionDate: "2024-02-15",
    progress: 80,
    assignedTo: "Michael Brown",
  },
  {
    id: "3",
    caseNumber: "IMM-2024-003",
    clientName: "Ahmed Hassan",
    caseType: "Citizenship Application",
    status: "pending",
    priority: "low",
    filingDate: "2024-01-25",
    nextAction: "Document Collection",
    nextActionDate: "2024-02-10",
    progress: 45,
    assignedTo: "Sarah Johnson",
  },
]

export const mockClients: Client[] = [
  {
    id: "1",
    name: "Maria Rodriguez",
    email: "maria.rodriguez@email.com",
    phone: "+1 (555) 123-4567",
    activeCases: 1,
    joinDate: "2024-01-15",
    status: "active",
  },
  {
    id: "2",
    name: "John Chen",
    email: "john.chen@email.com",
    phone: "+1 (555) 234-5678",
    activeCases: 2,
    joinDate: "2024-01-20",
    status: "active",
  },
  {
    id: "3",
    name: "Ahmed Hassan",
    email: "ahmed.hassan@email.com",
    phone: "+1 (555) 345-6789",
    activeCases: 1,
    joinDate: "2024-01-25",
    status: "active",
  },
]

export const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Passport Copy.pdf",
    type: "Identification",
    uploadDate: "2024-01-15",
    size: "2.4 MB",
    status: "approved",
    caseId: "1",
  },
  {
    id: "2",
    name: "Birth Certificate.pdf",
    type: "Personal Document",
    uploadDate: "2024-01-16",
    size: "1.8 MB",
    status: "pending",
    caseId: "1",
  },
  {
    id: "3",
    name: "Employment Letter.pdf",
    type: "Employment",
    uploadDate: "2024-01-20",
    size: "856 KB",
    status: "approved",
    caseId: "2",
  },
]
