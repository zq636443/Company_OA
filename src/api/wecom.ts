import { apiClient } from './client'
import type { WecomUser } from './types'

export interface WecomStatus {
  configured: boolean
  oauthEnabled: boolean
  oauthConfigured: boolean
  contactsConfigured: boolean
  corpIdConfigured: boolean
  agentIdConfigured: boolean
  secretConfigured: boolean
  contactSecretConfigured: boolean
  capabilities: string[]
}

export interface WecomUsersResponse {
  source: 'wecom' | 'mock'
  configured: boolean
  users: WecomUser[]
}

export interface WecomJsConfig {
  configured: boolean
  corpId?: string
  agentId?: string
  timestamp?: number
  nonceStr?: string
  signature?: string
  agentSignature?: string
  jsApiList?: string[]
}

export interface WecomOauthUrlResponse {
  configured: boolean
  url: string
}

export interface WecomOauthLoginResponse {
  configured: boolean
  user: WecomUser
}

export const wecomApi = {
  status: () => apiClient.get<WecomStatus>('/wecom/status'),
  users: (query?: { keyword?: string; departmentId?: number; fetchChild?: boolean }) =>
    apiClient.get<WecomUsersResponse>('/wecom/users', query),
  jsConfig: (url: string) => apiClient.get<WecomJsConfig>('/wecom/js-config', { url }),
  oauthUrl: (query: { redirectUri: string; state?: string; scope?: 'snsapi_base' | 'snsapi_privateinfo' }) =>
    apiClient.get<WecomOauthUrlResponse>('/wecom/oauth-url', query),
  oauthLogin: (code: string) => apiClient.post<WecomOauthLoginResponse>('/wecom/oauth-login', { code }),
}
