import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'node:crypto'

const prisma = new PrismaClient()

const purchaseFields = [
  { id: 'purpose', label: '采购用途', type: 'textarea', required: true, showInSummary: true },
  { id: 'vendor', label: '供应商', type: 'text', required: true, showInSummary: true },
  { id: 'amount', label: '金额', type: 'amount', required: true, showInSummary: true },
  { id: 'terms', label: '付款条款', type: 'textarea', required: true, showInSummary: false },
  { id: 'risk', label: '风险说明', type: 'textarea', required: false, showInSummary: false },
  { id: 'techParams', label: '技术参数', type: 'textarea', required: true, showInSummary: false },
  { id: 'afterSales', label: '售后承诺', type: 'textarea', required: false, showInSummary: false },
]

const purchaseNodes = [
  {
    id: 'start',
    name: '采购发起',
    type: '填写',
    handler: '发起人',
    approver: '',
    cc: '',
    editableFields: purchaseFields.map((field) => field.id),
    summaryFields: ['purpose', 'amount'],
  },
  {
    id: 'finance',
    name: '财务审核付款条款',
    type: '审核',
    handler: '林雅',
    approver: '林雅',
    cc: '彭总',
    editableFields: ['terms'],
    summaryFields: ['terms', 'amount'],
  },
  {
    id: 'legal',
    name: '法务/行政审核风险',
    type: '审核',
    handler: '吴桐',
    approver: '吴桐',
    cc: '陈露',
    editableFields: ['risk'],
    summaryFields: ['risk'],
  },
  {
    id: 'tech',
    name: '技术审核参数和售后',
    type: '审核',
    handler: '赵启明',
    approver: '赵启明',
    cc: '刘少鹏',
    editableFields: ['techParams', 'afterSales'],
    summaryFields: ['techParams', 'afterSales'],
  },
  {
    id: 'liu',
    name: '刘少鹏审批',
    type: '审批',
    handler: '刘少鹏',
    approver: '刘少鹏',
    cc: '彭总',
    editableFields: [],
    summaryFields: ['purpose', 'amount'],
  },
  {
    id: 'peng',
    name: '彭总审批',
    type: '审批',
    handler: '彭总',
    approver: '彭总',
    cc: '陈露',
    editableFields: [],
    summaryFields: ['amount', 'risk'],
  },
  {
    id: 'seal',
    name: '行政用印',
    type: '用印',
    handler: '陈露',
    approver: '陈露',
    cc: '发起人',
    editableFields: [],
    summaryFields: ['vendor', 'amount'],
  },
]

const templateSeeds = [
  {
    id: 'purchase',
    name: '采购申请流程',
    category: '采购',
    description: '采购发起、财务条款、法务风险、技术参数、老板审批、行政用印',
    duration: '约 2-3 天',
    favorite: true,
    fields: purchaseFields,
    nodes: purchaseNodes,
  },
  {
    id: 'seal',
    name: '行政用印流程',
    category: '用印',
    description: '合同、授权书、证明材料等用印申请与归档',
    duration: '约 1 天',
    favorite: true,
    fields: [
      { id: 'file', label: '用印文件', type: 'attachment', required: true, showInSummary: true },
      { id: 'sealType', label: '印章类型', type: 'text', required: true, showInSummary: true },
      { id: 'copies', label: '份数', type: 'text', required: true, showInSummary: true },
      { id: 'risk', label: '风险说明', type: 'textarea', required: false, showInSummary: false },
    ],
    nodes: [
      { id: 'start', name: '用印发起', type: '填写', handler: '发起人', approver: '', cc: '', editableFields: ['file', 'sealType', 'copies', 'risk'], summaryFields: ['file', 'sealType'] },
      { id: 'admin', name: '行政初审', type: '审核', handler: '陈露', approver: '陈露', cc: '彭总', editableFields: ['risk'], summaryFields: ['sealType', 'copies'] },
      { id: 'seal', name: '行政盖章', type: '用印', handler: '陈露', approver: '陈露', cc: '发起人', editableFields: [], summaryFields: ['file', 'copies'] },
    ],
  },
  {
    id: 'payment',
    name: '付款申请流程',
    category: '财务',
    description: '付款材料、预算归属、发票与付款节点确认',
    duration: '约 1-2 天',
    favorite: true,
    fields: [
      { id: 'payee', label: '付款对象', type: 'text', required: true, showInSummary: true },
      { id: 'amount', label: '付款金额', type: 'amount', required: true, showInSummary: true },
      { id: 'invoice', label: '发票状态', type: 'text', required: true, showInSummary: true },
      { id: 'budget', label: '预算科目', type: 'text', required: true, showInSummary: false },
    ],
    nodes: [
      { id: 'start', name: '付款发起', type: '填写', handler: '发起人', approver: '', cc: '', editableFields: ['payee', 'amount', 'invoice', 'budget'], summaryFields: ['payee', 'amount'] },
      { id: 'leader', name: '部门负责人确认', type: '审批', handler: '赵启明', approver: '赵启明', cc: '林雅', editableFields: [], summaryFields: ['amount', 'budget'] },
      { id: 'finance', name: '财务复核', type: '审核', handler: '林雅', approver: '林雅', cc: '彭总', editableFields: ['invoice'], summaryFields: ['amount', 'invoice'] },
      { id: 'pay', name: '付款执行', type: '归档', handler: '出纳', approver: '林雅', cc: '发起人', editableFields: [], summaryFields: ['payee', 'amount'] },
    ],
  },
]

async function main() {
  for (const template of templateSeeds) {
    await prisma.workflowTemplate.upsert({
      where: { id: template.id },
      update: {
        name: template.name,
        category: template.category,
        description: template.description,
        duration: template.duration,
        favorite: template.favorite,
        status: 'published',
        custom: false,
        fieldsJson: JSON.stringify(template.fields),
        nodesJson: JSON.stringify(template.nodes),
      },
      create: {
        id: template.id,
        name: template.name,
        category: template.category,
        description: template.description,
        duration: template.duration,
        favorite: template.favorite,
        status: 'published',
        custom: false,
        fieldsJson: JSON.stringify(template.fields),
        nodesJson: JSON.stringify(template.nodes),
      },
    })
  }

  const existing = await prisma.workflowInstance.findUnique({ where: { no: 'CG-20260510-001' } })
  if (!existing) {
    const workflowId = randomUUID()
    const values = {
      purpose: '华东售后备件补库',
      vendor: '上海锐衡机电有限公司',
      amount: '¥186,500',
      terms: '30% 预付，70% 验收后付款',
      risk: '售后响应义务需明确',
      techParams: 'RX-42A / RX-42B 混合采购',
      afterSales: '核心备件 24 小时响应，故障件 7 日内更换',
    }
    await prisma.workflowInstance.create({
      data: {
        id: workflowId,
        no: 'CG-20260510-001',
        templateId: 'purchase',
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
        stuckHours: 4,
        summaryJson: JSON.stringify([
          { label: '金额', value: '¥186,500' },
          { label: '供应商', value: '上海锐衡机电有限公司' },
          { label: '用途', value: '华东售后备件补库' },
          { label: '合同编号', value: '待生成' },
        ]),
        dataJson: JSON.stringify(values),
        nodes: {
          create: purchaseNodes.map((node, index) => ({
            id: randomUUID(),
            templateNodeId: node.id,
            order: index,
            name: node.name,
            type: node.type,
            status: index < 3 ? 'done' : index === 3 ? 'pending' : 'running',
            assignee: node.handler,
            approver: node.approver,
            cc: node.cc,
            time: index < 3 ? `05-10 ${String(9 + index).padStart(2, '0')}:20` : index === 3 ? '待处理' : '未开始',
            dwell: index < 3 ? '已处理' : index === 3 ? '已停留 4 小时' : '-',
            summaryJson: JSON.stringify(node.summaryFields.map((fieldId) => ({
              label: purchaseFields.find((field) => field.id === fieldId)?.label ?? fieldId,
              value: values[fieldId as keyof typeof values] ?? '待确认',
            }))),
            detailsJson: JSON.stringify(node.editableFields.map((fieldId) => ({
              label: purchaseFields.find((field) => field.id === fieldId)?.label ?? fieldId,
              value: values[fieldId as keyof typeof values] ?? '',
            }))),
            editable: index === 3,
            opinion: index < 3 ? '已确认，继续流转' : '',
            attachmentsJson: JSON.stringify(index === 0 ? ['采购清单.xlsx', '供应商报价.pdf'] : []),
          })),
        },
        logs: {
          create: {
            id: randomUUID(),
            actor: '张晨',
            action: 'create',
            opinion: '发起流程',
            metadataJson: '{}',
          },
        },
      },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
