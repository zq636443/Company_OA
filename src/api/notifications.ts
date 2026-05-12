import { apiClient } from './client'
import type { NotificationRecord } from './types'

export const notificationsApi = {
  list: () => apiClient.get<NotificationRecord[]>('/notifications'),
  markSent: (id: string) => apiClient.post<NotificationRecord>(`/notifications/${id}/mark-sent`),
}
