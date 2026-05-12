import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../../common/prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import { TemplatesService } from '../templates/templates.service'
import { CreateWorkflowDto } from './dto/create-workflow.dto'
import { NodeActionDto } from './dto/node-action.dto'

type FieldConfig = {
  id: string
  label: string
  type: string
  required: boolean
  showInSummary: boolean
}

type NodeConfig = {
  id: string
  name: string
  type: string
  handler: string
  approver: string
  cc: string
  editableFields: string[]
  summaryFields: string[]
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function formatTime(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: TemplatesService,
    private readonly notifications: NotificationsService,
  ) {}

  private toNodeDto(node: {
    id: string
    templateNodeId: string
    order: number
    name: string
    type: string
    status: string
    assignee: string
    approver: string
    cc: string
    time: string
    dwell: string
    summaryJson: string
    detailsJson: string
    editable: boolean
    opinion: string
    attachmentsJson: string
  }) {
    return {
      id: node.templateNodeId,
      recordId: node.id,
      order: node.order,
      name: node.name,
      type: node.type,
      status: node.status,
      assignee: node.assignee,
      approver: node.approver,
      cc: node.cc,
      time: node.time,
      dwell: node.dwell,
      summary: parseJson(node.summaryJson, []),
      details: parseJson(node.detailsJson, []),
      editable: node.editable,
      opinion: node.opinion,
      attachments: parseJson(node.attachmentsJson, []),
    }
  }

  private toWorkflowDto(workflow: any) {
    const nodes = workflow.nodes?.sort((a, b) => a.order - b.order).map((node) => this.toNodeDto(node)) ?? []

    return {
      id: workflow.id,
      no: workflow.no,
      templateId: workflow.templateId,
      title: workflow.title,
      category: workflow.category,
      status: workflow.status,
      initiator: workflow.initiator,
      department: workflow.department,
      currentNode: workflow.currentNode,
      owner: workflow.owner,
      amount: workflow.amount,
      vendor: workflow.vendor,
      purpose: workflow.purpose,
      startedAt: workflow.startedAt,
      updatedAt: workflow.updatedAt,
      stuckHours: workflow.stuckHours,
      summary: parseJson(workflow.summaryJson, []),
      data: parseJson(workflow.dataJson, {}),
      nodes,
    }
  }

  async list() {
    const workflows = await this.prisma.workflowInstance.findMany({
      include: { nodes: true },
      orderBy: { updatedAt: 'desc' },
    })
    return workflows.map((workflow) => this.toWorkflowDto(workflow))
  }

  async get(id: string) {
    const workflow = await this.prisma.workflowInstance.findUnique({
      where: { id },
      include: { nodes: true, logs: { orderBy: { createdAt: 'desc' } } },
    })
    if (!workflow) throw new NotFoundException('Workflow not found')
    return {
      ...this.toWorkflowDto(workflow),
      logs: workflow.logs,
    }
  }

  async create(dto: CreateWorkflowDto) {
    const template = await this.templates.get(dto.templateId)
    const fields = template.fieldConfigs as FieldConfig[]
    const nodes = template.nodes as NodeConfig[]
    const values = dto.values ?? {}
    const firstPendingNode = nodes[1] ?? nodes[0]
    const detailByFieldId = new Map(fields.map((field) => [field.id, { label: field.label, value: String(values[field.id] ?? '') }]))
    const startSummaryFields = nodes[0]?.summaryFields?.length
      ? nodes[0].summaryFields
      : fields.filter((field) => field.showInSummary).map((field) => field.id)
    const summary = startSummaryFields
      .map((fieldId) => detailByFieldId.get(fieldId))
      .filter(Boolean)
      .map((item) => ({ label: item!.label, value: item!.value || '待填写' }))
    const workflowId = randomUUID()
    const workflowCount = await this.prisma.workflowInstance.count()
    const no = `LC-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(workflowCount + 1).padStart(3, '0')}`
    const title = dto.title ?? `${template.name}-${dto.initiator}`

    const workflow = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workflowInstance.create({
        data: {
          id: workflowId,
          no,
          templateId: template.id,
          title,
          category: template.category,
          status: 'pending',
          initiator: dto.initiator,
          department: dto.department,
          currentNode: firstPendingNode?.name ?? '已完成',
          owner: firstPendingNode?.handler ?? '系统',
          amount: String(values.amount ?? values['金额'] ?? '-'),
          vendor: String(values.vendor ?? values['供应商'] ?? '-'),
          purpose: String(values.purpose ?? values['申请事由'] ?? title),
          summaryJson: JSON.stringify(summary),
          dataJson: JSON.stringify(values),
        },
      })

      for (const [index, node] of nodes.entries()) {
        const status = index === 0 ? 'done' : index === 1 ? 'pending' : 'running'
        const summaryItems = node.summaryFields.map((fieldId) => detailByFieldId.get(fieldId)).filter(Boolean)
        const detailItems = node.editableFields.map((fieldId) => detailByFieldId.get(fieldId)).filter(Boolean)

        await tx.workflowNode.create({
          data: {
            id: randomUUID(),
            workflowId,
            templateNodeId: node.id,
            order: index,
            name: node.name,
            type: node.type,
            status,
            assignee: node.handler,
            approver: node.approver,
            cc: node.cc,
            time: index === 0 ? formatTime() : index === 1 ? '待处理' : '未开始',
            dwell: index === 0 ? '刚刚' : index === 1 ? '已停留 0 小时' : '-',
            summaryJson: JSON.stringify(summaryItems),
            detailsJson: JSON.stringify(detailItems),
            editable: index === 1,
            opinion: index === 0 ? '流程已发起' : '',
            attachmentsJson: '[]',
          },
        })
      }

      await tx.auditLog.create({
        data: {
          id: randomUUID(),
          workflowId,
          actor: dto.initiator,
          action: 'create',
          opinion: '发起流程',
          metadataJson: JSON.stringify({ templateId: template.id }),
        },
      })

      return created
    })

    if (firstPendingNode?.handler) {
      await this.notifications.queue({
        workflowId,
        nodeId: firstPendingNode.id,
        targetUser: firstPendingNode.handler,
        title: `待处理：${title}`,
        content: `流程 ${no} 已到达 ${firstPendingNode.name}`,
        link: `/flow/${workflowId}`,
      })
    }

    return this.get(workflow.id)
  }

  async act(workflowId: string, templateNodeId: string, dto: NodeActionDto) {
    const workflow = await this.prisma.workflowInstance.findUnique({
      where: { id: workflowId },
      include: { nodes: true },
    })
    if (!workflow) throw new NotFoundException('Workflow not found')

    const nodes = workflow.nodes.sort((a, b) => a.order - b.order)
    const node = nodes.find((item) => item.templateNodeId === templateNodeId || item.id === templateNodeId)
    if (!node) throw new NotFoundException('Workflow node not found')

    if (dto.action === 'transfer') {
      if (!dto.transferTo) throw new NotFoundException('transferTo is required')
      await this.prisma.workflowNode.update({
        where: { id: node.id },
        data: {
          assignee: dto.transferTo,
          opinion: dto.opinion ?? '节点已转交',
        },
      })
      await this.prisma.workflowInstance.update({
        where: { id: workflowId },
        data: { owner: dto.transferTo },
      })
      await this.writeActionLog(workflowId, node.id, dto)
      return this.get(workflowId)
    }

    if (dto.action === 'reject') {
      await this.prisma.workflowNode.update({
        where: { id: node.id },
        data: {
          status: 'rejected',
          editable: false,
          time: formatTime(),
          opinion: dto.opinion ?? '已驳回',
        },
      })
      await this.prisma.workflowInstance.update({
        where: { id: workflowId },
        data: {
          status: 'rejected',
          currentNode: node.name,
          owner: node.assignee,
        },
      })
      await this.writeActionLog(workflowId, node.id, dto)
      return this.get(workflowId)
    }

    if (dto.action === 'return') {
      const startNode = nodes[0]
      await this.prisma.workflowNode.update({
        where: { id: node.id },
        data: {
          status: 'running',
          editable: false,
          opinion: dto.opinion ?? '已退回',
        },
      })
      await this.prisma.workflowNode.update({
        where: { id: startNode.id },
        data: {
          status: 'pending',
          editable: true,
          time: '待处理',
          dwell: '已退回',
        },
      })
      await this.prisma.workflowInstance.update({
        where: { id: workflowId },
        data: {
          status: 'pending',
          currentNode: startNode.name,
          owner: startNode.assignee,
        },
      })
      await this.writeActionLog(workflowId, node.id, dto)
      return this.get(workflowId)
    }

    const nextNode = nodes.find((item) => item.order === node.order + 1)
    await this.prisma.workflowNode.update({
      where: { id: node.id },
      data: {
        status: 'done',
        editable: false,
        time: formatTime(),
        dwell: '已处理',
        opinion: dto.opinion ?? '同意，继续流转',
      },
    })

    if (nextNode) {
      await this.prisma.workflowNode.update({
        where: { id: nextNode.id },
        data: {
          status: 'pending',
          editable: true,
          time: '待处理',
          dwell: '已停留 0 小时',
        },
      })
      await this.prisma.workflowInstance.update({
        where: { id: workflowId },
        data: {
          status: 'pending',
          currentNode: nextNode.name,
          owner: nextNode.assignee,
        },
      })
      await this.notifications.queue({
        workflowId,
        nodeId: nextNode.templateNodeId,
        targetUser: nextNode.assignee,
        title: `待处理：${workflow.title}`,
        content: `流程 ${workflow.no} 已到达 ${nextNode.name}`,
        link: `/flow/${workflowId}`,
      })
    } else {
      await this.prisma.workflowInstance.update({
        where: { id: workflowId },
        data: {
          status: 'done',
          currentNode: '已归档',
          owner: '系统',
        },
      })
    }

    await this.writeActionLog(workflowId, node.id, dto)
    return this.get(workflowId)
  }

  private async writeActionLog(workflowId: string, nodeId: string, dto: NodeActionDto) {
    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        workflowId,
        nodeId,
        actor: dto.actor,
        action: dto.action,
        opinion: dto.opinion ?? '',
        metadataJson: JSON.stringify({ transferTo: dto.transferTo ?? null }),
      },
    })
  }
}
