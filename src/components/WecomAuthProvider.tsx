import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DotLoading, ErrorBlock } from 'antd-mobile'
import { wecomApi } from '../api/wecom'
import type { WecomUser } from '../api/types'

const STORAGE_KEY = 'company-oa-current-user'
const REDIRECT_KEY = 'company-oa-oauth-redirected'

const fallbackUser: WecomUser = {
  userId: 'zhangchen',
  name: '张晨',
  departmentId: 1,
  departmentName: '供应链部',
  position: '流程发起人',
  source: 'mock',
}

interface WecomAuthContextValue {
  user: WecomUser
  ready: boolean
}

const WecomAuthContext = createContext<WecomAuthContextValue>({
  user: fallbackUser,
  ready: false,
})

function isWecomRuntime() {
  const ua = window.navigator.userAgent.toLowerCase()
  return ua.includes('wxwork') || ua.includes('wxworklocal') || new URLSearchParams(window.location.search).get('wecom_oauth') === '1'
}

function cleanOauthQuery() {
  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('state')
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
}

function readStoredUser() {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY)
    return text ? (JSON.parse(text) as WecomUser) : null
  } catch {
    return null
  }
}

function writeStoredUser(user: WecomUser) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function WecomAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WecomUser>(() => readStoredUser() ?? fallbackUser)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function boot() {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      if (code) {
        try {
          const result = await wecomApi.oauthLogin(code)
          if (!active) return
          setUser(result.user)
          writeStoredUser(result.user)
          window.sessionStorage.removeItem(REDIRECT_KEY)
          cleanOauthQuery()
        } catch (err) {
          if (active) setError((err as Error).message || '企业微信静默登录失败')
        } finally {
          if (active) setReady(true)
        }
        return
      }

      const stored = readStoredUser()
      if (stored) {
        setUser(stored)
        setReady(true)
        return
      }

      if (!isWecomRuntime()) {
        writeStoredUser(fallbackUser)
        setUser(fallbackUser)
        setReady(true)
        return
      }

      if (window.sessionStorage.getItem(REDIRECT_KEY)) {
        setReady(true)
        return
      }

      try {
        const state = `oa-${Date.now()}`
        const result = await wecomApi.oauthUrl({
          redirectUri: window.location.href,
          state,
          scope: 'snsapi_base',
        })
        if (result.configured && result.url) {
          window.sessionStorage.setItem(REDIRECT_KEY, '1')
          window.location.replace(result.url)
          return
        }
        writeStoredUser(fallbackUser)
        setUser(fallbackUser)
      } catch (err) {
        if (active) setError((err as Error).message || '企业微信授权地址获取失败')
      } finally {
        if (active) setReady(true)
      }
    }

    boot()
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(() => ({ user, ready }), [ready, user])

  if (!ready) {
    return (
      <div className="auth-loading">
        <span>正在识别企业微信身份</span>
        <DotLoading />
      </div>
    )
  }

  if (error) {
    return (
      <div className="auth-error">
        <ErrorBlock status="default" title="企业微信登录失败" description={error} />
      </div>
    )
  }

  return <WecomAuthContext.Provider value={value}>{children}</WecomAuthContext.Provider>
}

export function useCurrentUser() {
  return useContext(WecomAuthContext).user
}
