import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../../common/prisma/prisma.service'
import { UpsertTemplateDto } from './dto/upsert-template.dto'

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  toDto(template: {
    id: string
    name: string
    category: string
    description: string
    duration: string
    favorite: boolean
    status: string
    custom: boolean
    fieldsJson: string
    nodesJson: string
    createdAt: Date
    updatedAt: Date
  }) {
    const fieldConfigs = parseJson<Array<{ label: string }>>(template.fieldsJson, [])
    const nodes = parseJson<Array<unknown>>(template.nodesJson, [])

    return {
      id: template.id,
      name: template.name,
      category: template.category,
      description: template.description,
      duration: template.duration,
      favorite: template.favorite,
      status: template.status,
      custom: template.custom,
      fields: fieldConfigs.map((field) => field.label),
      fieldConfigs,
      nodes,
      nodeCount: nodes.length,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }
  }

  async list(includeDrafts = false) {
    const templates = await this.prisma.workflowTemplate.findMany({
      where: includeDrafts ? undefined : { status: 'published' },
      orderBy: [{ favorite: 'desc' }, { updatedAt: 'desc' }],
    })

    return templates.map((template) => this.toDto(template))
  }

  async get(id: string) {
    const template = await this.prisma.workflowTemplate.findUnique({ where: { id } })
    if (!template) throw new NotFoundException('Template not found')
    return this.toDto(template)
  }

  async create(dto: UpsertTemplateDto) {
    const id = dto.id ?? `custom-${randomUUID()}`
    const template = await this.prisma.workflowTemplate.create({
      data: {
        id,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        duration: dto.duration,
        favorite: dto.favorite,
        status: dto.status,
        custom: true,
        fieldsJson: JSON.stringify(dto.fieldConfigs),
        nodesJson: JSON.stringify(dto.nodes),
      },
    })

    return this.toDto(template)
  }

  async update(id: string, dto: UpsertTemplateDto) {
    await this.get(id)
    const template = await this.prisma.workflowTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        category: dto.category,
        description: dto.description,
        duration: dto.duration,
        favorite: dto.favorite,
        status: dto.status,
        fieldsJson: JSON.stringify(dto.fieldConfigs),
        nodesJson: JSON.stringify(dto.nodes),
      },
    })

    return this.toDto(template)
  }

  async remove(id: string) {
    await this.get(id)
    await this.prisma.workflowTemplate.delete({ where: { id } })
    return { ok: true }
  }
}
