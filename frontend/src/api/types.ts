import type { LucideIcon } from 'lucide-react'

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

export type StatusKey =
  | 'pending'
  | 'running'
  | 'done'
  | 'rejected'
  | 'overdue'
  | 'draft'
  | 'archived'

export type FieldType = 'text' | 'textarea' | 'amount' | 'date' | 'person' | 'attachment'

export interface TemplateFieldConfig {
  id: string
  label: string
  type: FieldType
  required: boolean
  showInSummary: boolean
}

export interface WecomUser {
  userId: string
  name: string
  departmentId?: number
  departmentName?: string
  mobile?: string
  position?: string
  avatar?: string
  source?: 'wecom' | 'mock' | 'sdk'
}

export interface TemplateNodeConfig {
  id: string
  name: string
  type: '填写' | '审核' | '审批' | '抄送' | '用印' | '归档'
  handler: string
  approver: string
  cc: string
  handlerUsers?: WecomUser[]
  approverUsers?: WecomUser[]
  ccUsers?: WecomUser[]
  editableFields: string[]
  summaryFields: string[]
}

export interface WorkflowTemplate {
  id: string
  name: string
  category: string
  description: string
  duration: string
  favorite: boolean
  status: 'draft' | 'published'
  custom: boolean
  fields: string[]
  fieldConfigs: TemplateFieldConfig[]
  nodes: TemplateNodeConfig[]
  nodeCount: number
  createdAt?: string
  updatedAt?: string
  icon?: LucideIcon
}

export interface UpsertWorkflowTemplate {
  id?: string
  name: string
  category: string
  description: string
  duration: string
  favorite: boolean
  status: 'draft' | 'published'
  fieldConfigs: TemplateFieldConfig[]
  nodes: TemplateNodeConfig[]
}

export interface SummaryField {
  label: string
  value: string
}

export interface FlowNode {
  id: string
  recordId?: string
  order?: number
  name: string
  type?: string
  status: StatusKey
  assignee: string
  approver?: string
  cc?: string
  time: string
  dwell: string
  summary: SummaryField[]
  details: SummaryField[]
  editable: boolean
  opinion: string
  attachments: string[]
}

export interface Workflow {
  id: string
  no: string
  templateId?: string
  title: string
  category: string
  status: StatusKey
  initiator: string
  department: string
  currentNode: string
  owner: string
  amount: string
  vendor: string
  purpose: string
  startedAt: string
  updatedAt: string
  stuckHours: number
  summary: SummaryField[]
  data?: Record<string, unknown>
  nodes: FlowNode[]
  logs?: Array<{
    id: string
    workflowId: string
    nodeId?: string | null
    actor: string
    action: string
    opinion: string
    metadataJson: string
    createdAt: string
  }>
}

export interface CreateWorkflowPayload {
  templateId: string
  title?: string
  initiator: string
  department: string
  values?: Record<string, unknown>
}

export interface NodeActionPayload {
  action: 'approve' | 'reject' | 'return' | 'transfer'
  actor: string
  opinion?: string
  transferTo?: string
}

export interface NotificationRecord {
  id: string
  workflowId?: string
  nodeId?: string
  targetUser: string
  title: string
  content: string
  link: string
  channel: string
  status: string
  errorMessage: string
  createdAt: string
  sentAt?: string | null
}
