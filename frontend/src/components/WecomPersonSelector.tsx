import { useMemo, useState } from 'react'
import { Toast } from 'antd-mobile'
import { UserRoundPlus } from 'lucide-react'
import { selectEnterpriseContacts } from '../api/wecomSdk'
import type { WecomUser } from '../api/types'

function usersToText(users: WecomUser[]) {
  return users.map((user) => user.name).filter(Boolean).join('、')
}

function textToUsers(value: string): WecomUser[] {
  return value
    .split(/[、,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({ userId: name, name, source: 'mock' as const }))
}

function uniqueUsers(users: WecomUser[]) {
  const seen = new Set<string>()
  return users.filter((user) => {
    const key = user.userId || user.name
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

interface WecomPersonSelectorProps {
  label: string
  value: string
  selectedUsers?: WecomUser[]
  placeholder?: string
  multiple?: boolean
  includeDepartments?: boolean
  onChange: (value: string, users: WecomUser[]) => void
}

export function WecomPersonSelector({
  label,
  value,
  selectedUsers = [],
  placeholder = '选择企业微信人员/部门',
  multiple = true,
  includeDepartments = true,
  onChange,
}: WecomPersonSelectorProps) {
  const [picking, setPicking] = useState(false)

  const committedUsers = useMemo(
    () => (selectedUsers.length ? selectedUsers : value ? textToUsers(value) : []),
    [selectedUsers, value],
  )

  const applyUsers = (nextUsers: WecomUser[]) => {
    const normalized = uniqueUsers(nextUsers)
    onChange(usersToText(normalized), normalized)
  }

  const handlePickContacts = async () => {
    setPicking(true)
    try {
      const pickedUsers = await selectEnterpriseContacts({
        multiple,
        selectedUsers: committedUsers,
        includeDepartments,
      })
      if (!pickedUsers.length) {
        Toast.show('未选择人员或部门')
        return
      }
      applyUsers(pickedUsers)
    } catch (error) {
      Toast.show((error as Error).message || '企业微信选人/部门不可用')
    } finally {
      setPicking(false)
    }
  }

  return (
    <label className="wecom-person-field">
      <span>{label}</span>
      <button type="button" className="wecom-person-trigger" onClick={handlePickContacts} disabled={picking}>
        <UserRoundPlus size={16} />
        <strong>{picking ? '正在打开企业微信选择器...' : value || placeholder}</strong>
      </button>
    </label>
  )
}
