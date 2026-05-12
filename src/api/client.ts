const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3001/api'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

interface RequestOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined>
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(`${API_BASE_URL}${path}`)
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value))
  })
  return url.toString()
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, headers, body, ...rest } = options
  const response = await fetch(buildUrl(path, query), {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body,
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message =
      typeof data?.message === 'string'
        ? data.message
        : Array.isArray(data?.message)
          ? data.message.join('，')
          : `请求失败：${response.status}`
    throw new ApiError(message, response.status, data)
  }

  return data as T
}

export const apiClient = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { method: 'GET', query }),
  post: <T>(path: string, payload?: unknown) =>
    request<T>(path, { method: 'POST', body: payload === undefined ? undefined : JSON.stringify(payload) }),
  patch: <T>(path: string, payload?: unknown) =>
    request<T>(path, { method: 'PATCH', body: payload === undefined ? undefined : JSON.stringify(payload) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
