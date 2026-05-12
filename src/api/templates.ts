import { apiClient } from './client'
import type { UpsertWorkflowTemplate, WorkflowTemplate } from './types'

export const templatesApi = {
  list: (includeDrafts = false) =>
    apiClient.get<WorkflowTemplate[]>('/templates', includeDrafts ? { includeDrafts: true } : undefined),
  get: (id: string) => apiClient.get<WorkflowTemplate>(`/templates/${id}`),
  create: (payload: UpsertWorkflowTemplate) => apiClient.post<WorkflowTemplate>('/templates', payload),
  update: (id: string, payload: UpsertWorkflowTemplate) => apiClient.patch<WorkflowTemplate>(`/templates/${id}`, payload),
  remove: (id: string) => apiClient.delete<{ ok: true }>(`/templates/${id}`),
}
