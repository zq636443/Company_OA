import {
  BadgeCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Landmark,
  PackageCheck,
  ReceiptText,
  Scale,
  Stamp,
  Wrench,
} from 'lucide-react'
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

export interface WorkflowTemplate {
  id: string
  name: string
  category: string
  description: string
  nodeCount: number
  duration: string
  favorite: boolean
  icon: LucideIcon
  fields: string[]
  custom?: boolean
  status?: 'draft' | 'published'
  fieldConfigs?: TemplateFieldConfig[]
  nodes?: TemplateNodeConfig[]
  updatedAt?: string
}

export type FieldType = 'text' | 'textarea' | 'amount' | 'date' | 'person' | 'attachment'

export interface TemplateFieldConfig {
  id: string
  label: string
  type: FieldType
  required: boolean
  showInSummary: boolean
}

export interface TemplateNodeConfig {
  id: string
  name: string
  type: '填写' | '审核' | '审批' | '抄送' | '用印' | '归档'
  handler: string
  approver: string
  cc: string
  editableFields: string[]
  summaryFields: string[]
}

export interface SummaryField {
  label: string
  value: string
}

export interface FlowNode {
  id: string
  name: string
  status: StatusKey
  assignee: string
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
  nodes: FlowNode[]
}

export const categories = ['全部', '采购', '财务', '法务', '行政', '人事', '技术', '用印']

export const statusMeta: Record<StatusKey, { label: string; tone: Tone }> = {
  pending: { label: '待处理', tone: 'warning' },
  running: { label: '流转中', tone: 'primary' },
  done: { label: '已完成', tone: 'success' },
  rejected: { label: '已驳回', tone: 'danger' },
  overdue: { label: '已超时', tone: 'danger' },
  draft: { label: '草稿', tone: 'neutral' },
  archived: { label: '已归档', tone: 'neutral' },
}

export const templates: WorkflowTemplate[] = [
  {
    id: 'purchase',
    name: '采购申请流程',
    category: '采购',
    description: '采购发起、财务条款、法务风险、技术参数、老板审批、行政用印',
    nodeCount: 7,
    duration: '约 2-3 天',
    favorite: true,
    icon: PackageCheck,
    fields: ['采购用途', '供应商', '金额', '付款条款', '技术参数', '售后承诺'],
  },
  {
    id: 'seal',
    name: '行政用印流程',
    category: '用印',
    description: '合同、授权书、证明材料等用印申请与归档',
    nodeCount: 5,
    duration: '约 1 天',
    favorite: true,
    icon: Stamp,
    fields: ['用印文件', '印章类型', '份数', '风险说明'],
  },
  {
    id: 'contract',
    name: '合同评审流程',
    category: '法务',
    description: '合同正文、商务条款、法务风险与签署流转',
    nodeCount: 6,
    duration: '约 2 天',
    favorite: false,
    icon: Scale,
    fields: ['合同相对方', '合同金额', '履约周期', '风险条款'],
  },
  {
    id: 'payment',
    name: '付款申请流程',
    category: '财务',
    description: '付款材料、预算归属、发票与付款节点确认',
    nodeCount: 4,
    duration: '约 1-2 天',
    favorite: true,
    icon: Landmark,
    fields: ['付款对象', '付款金额', '发票状态', '预算科目'],
  },
  {
    id: 'after-sales',
    name: '售后处理流程',
    category: '技术',
    description: '售后问题登记、技术判断、备件申请与客户反馈',
    nodeCount: 5,
    duration: '约 3 天',
    favorite: false,
    icon: Wrench,
    fields: ['客户名称', '问题描述', '处理方案', '备件需求'],
  },
  {
    id: 'recruit',
    name: '人员入职流程',
    category: '人事',
    description: '录用确认、行政资产、账号权限与入职材料',
    nodeCount: 5,
    duration: '约 2 天',
    favorite: false,
    icon: BriefcaseBusiness,
    fields: ['候选人', '岗位', '入职日期', '设备需求'],
  },
]

const purchaseNodes: FlowNode[] = [
  {
    id: 'start',
    name: '采购发起',
    status: 'done',
    assignee: '张晨',
    time: '05-10 09:12',
    dwell: '12 分钟',
    summary: [
      { label: '采购用途', value: '华东售后备件补库' },
      { label: '金额', value: '¥186,500' },
    ],
    details: [
      { label: '申请部门', value: '供应链部' },
      { label: '供应商', value: '上海锐衡机电有限公司' },
      { label: '交付时间', value: '2026-05-18' },
      { label: '采购明细', value: '传感器 60 套、控制模块 20 套、线束包 180 组' },
    ],
    editable: false,
    opinion: '补库需求已核对，库存低于安全线。',
    attachments: ['采购清单.xlsx', '供应商报价.pdf'],
  },
  {
    id: 'finance',
    name: '财务审核付款条款',
    status: 'done',
    assignee: '林雅',
    time: '05-10 10:04',
    dwell: '52 分钟',
    summary: [
      { label: '付款条款', value: '30% 预付，70% 验收后' },
      { label: '预算', value: '售后备件预算内' },
    ],
    details: [
      { label: '预算科目', value: '售后服务-备件采购' },
      { label: '发票要求', value: '13% 增值税专用发票' },
      { label: '付款风险', value: '预付款比例偏高，建议绑定交付验收节点。' },
    ],
    editable: false,
    opinion: '预算充足，建议预付款不超过 30%。',
    attachments: ['预算占用截图.png'],
  },
  {
    id: 'legal',
    name: '法务/行政审核风险',
    status: 'done',
    assignee: '吴桐',
    time: '05-10 11:20',
    dwell: '1 小时 16 分',
    summary: [
      { label: '风险等级', value: '中' },
      { label: '需补充', value: '延期违约条款' },
    ],
    details: [
      { label: '合同版本', value: '供应商标准合同 v3' },
      { label: '风险说明', value: '售后响应义务描述不够具体，违约责任需明确。' },
      { label: '处理建议', value: '补充 48 小时响应和延期赔付条款后继续流转。' },
    ],
    editable: false,
    opinion: '已标注合同风险点。',
    attachments: ['合同风险批注.docx'],
  },
  {
    id: 'tech',
    name: '技术审核参数和售后',
    status: 'pending',
    assignee: '赵启明',
    time: '待处理',
    dwell: '已停留 4 小时',
    summary: [
      { label: '参数匹配', value: '待确认' },
      { label: '售后承诺', value: '待确认' },
    ],
    details: [
      { label: '型号参数', value: 'RX-42A / RX-42B 混合采购' },
      { label: '兼容设备', value: '二代巡检设备与自动化控制柜' },
      { label: '售后要求', value: '核心备件 24 小时内响应，故障件 7 日内更换。' },
    ],
    editable: true,
    opinion: '',
    attachments: ['技术参数表.pdf'],
  },
  {
    id: 'liu',
    name: '刘少鹏审批',
    status: 'running',
    assignee: '刘少鹏',
    time: '未开始',
    dwell: '-',
    summary: [{ label: '关注点', value: '采购必要性、价格合理性' }],
    details: [
      { label: '审批权限', value: '部门负责人审批' },
      { label: '前置条件', value: '技术审核通过后自动推送。' },
    ],
    editable: false,
    opinion: '',
    attachments: [],
  },
  {
    id: 'peng',
    name: '彭总审批',
    status: 'running',
    assignee: '彭总',
    time: '未开始',
    dwell: '-',
    summary: [{ label: '关注点', value: '金额、风险、付款条款' }],
    details: [
      { label: '审批权限', value: '总经理审批' },
      { label: '触发条件', value: '金额超过 ¥100,000。' },
    ],
    editable: false,
    opinion: '',
    attachments: [],
  },
  {
    id: 'seal',
    name: '行政用印',
    status: 'running',
    assignee: '陈露',
    time: '未开始',
    dwell: '-',
    summary: [{ label: '用印材料', value: '合同正本 2 份' }],
    details: [
      { label: '印章类型', value: '合同专用章' },
      { label: '归档要求', value: '扫描件回传并上传合同编号。' },
    ],
    editable: false,
    opinion: '',
    attachments: [],
  },
]

export const workflows: Workflow[] = [
  {
    id: 'wf-001',
    no: 'CG-20260510-001',
    title: '华东售后备件采购申请',
    category: '采购',
    status: 'pending',
    initiator: '张晨',
    department: '供应链部',
    currentNode: '技术审核参数和售后',
    owner: '赵启明',
    amount: '¥186,500',
    vendor: '上海锐衡机电有限公司',
    purpose: '华东售后备件补库',
    startedAt: '2026-05-10 09:12',
    updatedAt: '2026-05-10 13:42',
    stuckHours: 4,
    summary: [
      { label: '金额', value: '¥186,500' },
      { label: '供应商', value: '上海锐衡机电有限公司' },
      { label: '用途', value: '华东售后备件补库' },
      { label: '合同编号', value: '待生成' },
    ],
    nodes: purchaseNodes,
  },
  {
    id: 'wf-002',
    no: 'YZ-20260510-003',
    title: '南京项目授权书用印',
    category: '用印',
    status: 'overdue',
    initiator: '黄倩',
    department: '行政部',
    currentNode: '彭总审批',
    owner: '彭总',
    amount: '-',
    vendor: '南京轨交项目组',
    purpose: '投标授权文件盖章',
    startedAt: '2026-05-09 15:30',
    updatedAt: '2026-05-10 11:05',
    stuckHours: 19,
    summary: [
      { label: '用印文件', value: '项目投标授权书' },
      { label: '印章类型', value: '公章' },
      { label: '份数', value: '3 份' },
      { label: '截止', value: '今日 17:00' },
    ],
    nodes: purchaseNodes.map((node, index) => ({
      ...node,
      id: `seal-${node.id}`,
      status: index < 5 ? 'done' : index === 5 ? 'overdue' : 'running',
      name: ['用印发起', '行政初审', '法务风险确认', '业务负责人确认', '刘少鹏审批', '彭总审批', '行政盖章'][index],
      assignee: ['黄倩', '陈露', '吴桐', '赵启明', '刘少鹏', '彭总', '陈露'][index],
    })),
  },
  {
    id: 'wf-003',
    no: 'FK-20260510-006',
    title: '五月云服务费用付款',
    category: '财务',
    status: 'running',
    initiator: '周敏',
    department: '技术部',
    currentNode: '财务复核',
    owner: '林雅',
    amount: '¥42,800',
    vendor: '北京云阶科技有限公司',
    purpose: '生产环境云资源费用',
    startedAt: '2026-05-10 10:40',
    updatedAt: '2026-05-10 14:01',
    stuckHours: 2,
    summary: [
      { label: '金额', value: '¥42,800' },
      { label: '付款对象', value: '北京云阶科技有限公司' },
      { label: '发票状态', value: '已到票' },
      { label: '预算', value: '技术预算内' },
    ],
    nodes: purchaseNodes.slice(0, 4).map((node, index) => ({
      ...node,
      id: `pay-${node.id}`,
      name: ['付款发起', '部门负责人确认', '财务复核', '付款执行'][index],
      assignee: ['周敏', '赵启明', '林雅', '出纳'][index],
      status: index < 2 ? 'done' : index === 2 ? 'pending' : 'running',
    })),
  },
  {
    id: 'wf-004',
    no: 'HT-20260508-012',
    title: '西南渠道年度合同评审',
    category: '法务',
    status: 'done',
    initiator: '梁川',
    department: '销售部',
    currentNode: '已归档',
    owner: '系统',
    amount: '¥960,000',
    vendor: '成都明远商贸有限公司',
    purpose: '渠道年度合作',
    startedAt: '2026-05-08 11:18',
    updatedAt: '2026-05-09 16:36',
    stuckHours: 0,
    summary: [
      { label: '金额', value: '¥960,000' },
      { label: '相对方', value: '成都明远商贸有限公司' },
      { label: '履约周期', value: '2026.06-2027.05' },
      { label: '归档编号', value: 'HT-2026-228' },
    ],
    nodes: purchaseNodes.map((node, index) => ({
      ...node,
      id: `contract-${node.id}`,
      name: ['合同发起', '商务条款审核', '法务评审', '技术附件确认', '刘少鹏审批', '彭总审批', '合同归档'][index],
      status: 'done',
      time: `05-0${8 + Math.floor(index / 4)} ${9 + index}:20`,
    })),
  },
]

export const quickFilters = [
  { label: '超时', value: 'overdue', icon: BadgeCheck },
  { label: '采购', value: 'purchase', icon: PackageCheck },
  { label: '用印', value: 'seal', icon: Stamp },
  { label: '合同', value: 'contract', icon: FileText },
  { label: '高金额', value: 'highAmount', icon: ReceiptText },
]

export const myEntries = [
  { label: '我发起的', value: '18', icon: FileCheck2 },
  { label: '草稿箱', value: '3', icon: ClipboardCheck },
  { label: '抄送记录', value: '27', icon: FileText },
]
