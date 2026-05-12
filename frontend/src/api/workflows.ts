import { apiClient } from './client'
import type { CreateWorkflowPayload, NodeActionPayload, Workflow } from './types'

export const workflowsApi = {
  list: () => apiClient.get<Workflow[]>('/workflows'),
  get: (id: string) => apiClient.get<Workflow>(`/workflows/${id}`),
  create: (payload: CreateWorkflowPayload) => apiClient.post<Workflow>('/workflows', payload),
  act: (workflowId: string, nodeId: string, payload: NodeActionPayload) =>
    apiClient.post<Workflow>(`/workflows/${workflowId}/nodes/${nodeId}/action`, payload),
}
