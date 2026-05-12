const STORAGE_KEY = 'company-oa-eruda'

function updateDebugFlag(value: string | null) {
  if (value === '1' || value === 'true') {
    window.localStorage.setItem(STORAGE_KEY, '1')
    return true
  }
  if (value === '0' || value === 'false') {
    window.localStorage.removeItem(STORAGE_KEY)
    return false
  }
  return window.localStorage.getItem(STORAGE_KEY) === '1'
}

export async function initErudaDebug() {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  const enabled = updateDebugFlag(params.get('eruda') ?? params.get('debug'))
  if (!enabled) return

  const eruda = (await import('eruda')).default
  eruda.init()
}
