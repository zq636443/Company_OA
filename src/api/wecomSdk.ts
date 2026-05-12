import { wecomApi } from './wecom'
import type { WecomUser } from './types'

const SDK_URL = 'https://res.wx.qq.com/open/js/jweixin-1.2.0.js'
const CONTACT_JS_API = 'selectEnterpriseContact'
const DEPARTMENT_PREFIX = 'department:'

type WecomWx = {
  config: (options: Record<string, unknown>) => void
  ready: (callback: () => void) => void
  error: (callback: (error: unknown) => void) => void
  agentConfig?: (options: Record<string, unknown>) => void
  invoke: (api: string, options: Record<string, unknown>, callback: (result: Record<string, unknown>) => void) => void
}

declare global {
  interface Window {
    wx?: WecomWx
  }
}

let loadingPromise: Promise<void> | null = null

function currentSignUrl() {
  return window.location.href.split('#')[0]
}

function loadWecomSdk() {
  if (window.wx) return Promise.resolve()
  if (loadingPromise) return loadingPromise

  loadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('企业微信 JS-SDK 加载失败')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = SDK_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('企业微信 JS-SDK 加载失败'))
    document.head.appendChild(script)
  })

  return loadingPromise
}

function normalizeSdkContacts(value: unknown): WecomUser[] {
  const result = typeof value === 'string' ? JSON.parse(value) : value
  const rawUsers = Array.isArray(result)
    ? result
    : Array.isArray((result as { userList?: unknown[] })?.userList)
      ? (result as { userList: unknown[] }).userList
      : []
  const rawDepartments = Array.isArray((result as { departmentList?: unknown[] })?.departmentList)
    ? (result as { departmentList: unknown[] }).departmentList
    : []

  const users = rawUsers
    .map((item) => item as Record<string, unknown>)
    .map((item) => ({
      userId: String(item.userid ?? item.id ?? item.userId ?? ''),
      name: String(item.name ?? item.userName ?? item.user_id ?? item.userid ?? item.id ?? ''),
      avatar: typeof item.avatar === 'string' ? item.avatar : undefined,
      source: 'sdk' as const,
    }))
    .filter((item) => item.userId || item.name)

  const departments = rawDepartments
    .map((item) => item as Record<string, unknown>)
    .map((item) => {
      const rawId = String(item.id ?? item.departmentId ?? item.deptId ?? '')
      const name = String(item.name ?? item.departmentName ?? rawId)
      return {
        userId: `${DEPARTMENT_PREFIX}${rawId || name}`,
        name,
        departmentId: Number.isNaN(Number(rawId)) ? undefined : Number(rawId),
        departmentName: name,
        position: '部门',
        source: 'sdk' as const,
      }
    })
    .filter((item) => item.userId || item.name)

  return [...users, ...departments]
}

function normalizeDepartmentId(id: string) {
  const value = id.replace(DEPARTMENT_PREFIX, '')
  const numberValue = Number(value)
  return Number.isNaN(numberValue) ? value : numberValue
}

function invokeContactPicker(
  mode: 'single' | 'multi',
  selectedUserIds: string[],
  selectedDepartmentIds: Array<string | number>,
  includeDepartments: boolean,
) {
  return new Promise<WecomUser[]>((resolve, reject) => {
    const wx = window.wx
    if (!wx?.invoke) {
      reject(new Error('当前环境不支持企业微信原生选人/部门'))
      return
    }

    wx.invoke(
      CONTACT_JS_API,
      {
        fromDepartmentId: 0,
        mode,
        type: includeDepartments ? ['department', 'user'] : ['user'],
        selectedUserIds,
        selectedDepartmentIds,
      },
      (result) => {
        const message = String(result.err_msg ?? result.errMsg ?? '')
        if (message && !message.includes(':ok')) {
          reject(new Error(message || '企业微信选人已取消'))
          return
        }
        try {
          resolve(normalizeSdkContacts(result.result ?? result))
        } catch {
          reject(new Error('企业微信选人/部门结果解析失败'))
        }
      },
    )
  })
}

export async function selectEnterpriseContacts(options: {
  multiple?: boolean
  selectedUsers?: WecomUser[]
  includeDepartments?: boolean
}) {
  await loadWecomSdk()
  const config = await wecomApi.jsConfig(currentSignUrl())

  if (!config.configured || !config.corpId || !config.agentId || !config.timestamp || !config.nonceStr || !config.signature) {
    throw new Error('企业微信 JS-SDK 尚未配置')
  }

  const wx = window.wx
  if (!wx) throw new Error('企业微信 JS-SDK 不可用')

  const jsApiList = config.jsApiList?.length ? config.jsApiList : [CONTACT_JS_API]
  const includeDepartments = options.includeDepartments !== false
  const selectedUserIds =
    options.selectedUsers
      ?.map((user) => user.userId)
      .filter((id) => id && !id.startsWith(DEPARTMENT_PREFIX)) ?? []
  const selectedDepartmentIds =
    options.selectedUsers
      ?.map((user) => user.userId)
      .filter((id) => id?.startsWith(DEPARTMENT_PREFIX))
      .map(normalizeDepartmentId) ?? []
  const mode = options.multiple === false ? 'single' : 'multi'

  return new Promise<WecomUser[]>((resolve, reject) => {
    const openPicker = () => {
      invokeContactPicker(mode, selectedUserIds, selectedDepartmentIds, includeDepartments).then(resolve).catch(reject)
    }

    wx.error(reject)
    wx.ready(() => {
      if (wx.agentConfig && config.agentSignature) {
        wx.agentConfig({
          corpid: config.corpId,
          agentid: config.agentId,
          timestamp: config.timestamp,
          nonceStr: config.nonceStr,
          signature: config.agentSignature,
          jsApiList,
          success: openPicker,
          fail: reject,
        })
      } else {
        openPicker()
      }
    })
    wx.config({
      beta: true,
      debug: false,
      appId: config.corpId,
      timestamp: config.timestamp,
      nonceStr: config.nonceStr,
      signature: config.signature,
      jsApiList,
    })
  })
}
