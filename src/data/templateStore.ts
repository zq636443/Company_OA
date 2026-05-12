import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { templates as builtinTemplates } from './mock'
import type { TemplateFieldConfig, TemplateNodeConfig, WorkflowTemplate } from './mock'

const STORAGE_KEY = 'company-oa-custom-templates'

export interface StoredWorkflowTemplate {
  id: string
  name: string
  category: string
  description: string
  duration: string
  favorite: boolean
  status: 'draft' | 'published'
  fieldConfigs: TemplateFieldConfig[]
  nodes: TemplateNodeConfig[]
  updatedAt: string
}

function readStoredTemplates(): StoredWorkflowTemplate[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStoredTemplates(items: StoredWorkflowTemplate[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('company-oa-templates-updated'))
}

export function toWorkflowTemplate(item: StoredWorkflowTemplate): WorkflowTemplate {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description,
    duration: item.duration,
    favorite: item.favorite,
    status: item.status,
    custom: true,
    icon: ClipboardList,
    fields: item.fieldConfigs.map((field) => field.label),
    fieldConfigs: item.fieldConfigs,
    nodes: item.nodes,
    nodeCount: item.nodes.length,
    updatedAt: item.updatedAt,
  }
}

export function getStoredTemplates(includeDrafts = false) {
  return readStoredTemplates()
    .filter((item) => includeDrafts || item.status === 'published')
    .map(toWorkflowTemplate)
}

export function getAllWorkflowTemplates(includeDrafts = false) {
  return [...builtinTemplates, ...getStoredTemplates(includeDrafts)]
}

export function getStoredTemplate(id: string) {
  return readStoredTemplates().find((item) => item.id === id)
}

export function saveStoredTemplate(template: StoredWorkflowTemplate) {
  const items = readStoredTemplates()
  const next = [template, ...items.filter((item) => item.id !== template.id)]
  writeStoredTemplates(next)
}

export function deleteStoredTemplate(id: string) {
  writeStoredTemplates(readStoredTemplates().filter((item) => item.id !== id))
}

export function createTemplateId() {
  return `custom-${Date.now().toString(36)}`
}

export function useWorkflowTemplates(includeDrafts = false) {
  const [items, setItems] = useState(() => getAllWorkflowTemplates(includeDrafts))

  useEffect(() => {
    const refresh = () => setItems(getAllWorkflowTemplates(includeDrafts))
    window.addEventListener('company-oa-templates-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('company-oa-templates-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [includeDrafts])

  return items
}
