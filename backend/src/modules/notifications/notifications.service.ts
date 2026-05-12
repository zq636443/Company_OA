import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../../common/prisma/prisma.service'

export interface QueueNotificationInput {
  workflowId?: string
  nodeId?: string
  targetUser: string
  title: string
  content: string
  link: string
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.notification.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async queue(input: QueueNotificationInput) {
    return this.prisma.notification.create({
      data: {
        id: randomUUID(),
        workflowId: input.workflowId,
        nodeId: input.nodeId,
        targetUser: input.targetUser,
        title: input.title,
        content: input.content,
        link: input.link,
      },
    })
  }

  async markSent(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    })
  }
}
