// API client utilities for frontend data fetching

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any,
  ) {
    super(message)
    this.name = "APIError"
  }
}

async function fetchAPI(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Ocurrió un error" }))
    throw new APIError(error.error || "La solicitud falló", response.status, error)
  }

  return response.json()
}

export const apiClient = {
  get: (url: string) => fetchAPI(url),

  post: (url: string, data: any) =>
    fetchAPI(url, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  patch: (url: string, data: any) =>
    fetchAPI(url, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (url: string) =>
    fetchAPI(url, {
      method: "DELETE",
    }),

  upload: (url: string, formData: FormData) =>
    fetch(url, {
      method: "POST",
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json()
        throw new APIError(error.error, res.status, error)
      }
      return res.json()
    }),
}

export const api = {
  // Auth
  getCurrentUser: () => apiClient.get("/api/auth/me"),

  // Cases
  getCases: (params?: { status?: string; client_id?: string }) => {
    const query = new URLSearchParams(params as any).toString()
    return apiClient.get(`/api/cases${query ? `?${query}` : ""}`)
  },

  getCase: (id: string) => apiClient.get(`/api/cases/${id}`),

  createCase: (data: any) => apiClient.post("/api/cases", data),

  updateCase: (id: string, data: any) => apiClient.patch(`/api/cases/${id}`, data),

  updateCaseStage: (caseId: string | number, stageId: string | number, data: any) =>
    apiClient.patch(`/api/cases/${caseId}/stages/${stageId}`, data),

  createCaseEvent: (caseId: string | number, data: any) => apiClient.post(`/api/cases/${caseId}/events`, data),

  getCaseContacts: (caseId: string | number) => apiClient.get(`/api/cases/${caseId}/contacts`),
  createCaseContact: (caseId: string | number, data: any) => apiClient.post(`/api/cases/${caseId}/contacts`, data),
  updateCaseContact: (caseId: string | number, contactId: string | number, data: any) =>
    apiClient.patch(`/api/cases/${caseId}/contacts/${contactId}`, data),
  deleteCaseContact: (caseId: string | number, contactId: string | number) =>
    apiClient.delete(`/api/cases/${caseId}/contacts/${contactId}`),

  getCaseKeyDates: (caseId: string | number) => apiClient.get(`/api/cases/${caseId}/key-dates`),
  createCaseKeyDate: (caseId: string | number, data: any) => apiClient.post(`/api/cases/${caseId}/key-dates`, data),
  updateCaseKeyDate: (caseId: string | number, keyDateId: string | number, data: any) =>
    apiClient.patch(`/api/cases/${caseId}/key-dates/${keyDateId}`, data),
  deleteCaseKeyDate: (caseId: string | number, keyDateId: string | number) =>
    apiClient.delete(`/api/cases/${caseId}/key-dates/${keyDateId}`),

  // Clients
  getClients: (params?: { search?: string }) => {
    const query = new URLSearchParams(params as any).toString()
    return apiClient.get(`/api/clients${query ? `?${query}` : ""}`)
  },

  getClient: (id: string) => apiClient.get(`/api/clients/${id}`),

  createClient: (data: any) => apiClient.post("/api/clients", data),

  updateClient: (id: string, data: any) => apiClient.patch(`/api/clients/${id}`, data),

  deleteClient: (id: string) => apiClient.delete(`/api/clients/${id}`),

  // Documents
  getDocuments: (params?: { case_id?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString()
    return apiClient.get(`/api/documents${query ? `?${query}` : ""}`)
  },

  uploadDocument: (formData: FormData) => apiClient.upload("/api/documents", formData),

  updateDocument: (id: string, data: any) => apiClient.patch(`/api/documents/${id}`, data),

  deleteDocument: (id: string) => apiClient.delete(`/api/documents/${id}`),

  // Messages
  getMessages: (params?: { case_id?: string }) => {
    const query = new URLSearchParams(params as any).toString()
    return apiClient.get(`/api/messages${query ? `?${query}` : ""}`)
  },

  sendMessage: (data: any) => apiClient.post("/api/messages", data),

  markMessageRead: (id: string) => apiClient.patch(`/api/messages/${id}`, {}),

  // Notifications
  getNotifications: (unreadOnly?: boolean) =>
    apiClient.get(`/api/notifications${unreadOnly ? "?unread_only=true" : ""}`),

  markNotificationRead: (id: string) => apiClient.post(`/api/notifications/${id}/read`, {}),

  markAllNotificationsRead: () => apiClient.post("/api/notifications/read-all", {}),

  // Stats
  getStats: () => apiClient.get("/api/stats"),

  // Analytics
  getDashboardAnalytics: () => apiClient.get("/api/analytics/dashboard"),

  getReport: (type: string, params?: { start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams({ type, ...params } as any).toString()
    return apiClient.get(`/api/analytics/reports?${query}`)
  },

  // Activity
  getActivity: (params?: { case_id?: string; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString()
    return apiClient.get(`/api/activity${query ? `?${query}` : ""}`)
  },

  // Case types
  getCaseTypes: () => apiClient.get("/api/case-types"),
  createCaseType: (data: any) => apiClient.post("/api/case-types", data),
  updateCaseType: (id: string, data: any) => apiClient.patch(`/api/case-types/${id}`, data),
  deleteCaseType: (id: string) => apiClient.delete(`/api/case-types/${id}`),

  // Users
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient.post("/api/users/password", payload),
}
