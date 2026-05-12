import { Controller, Get, Param, Post } from '@nestjs/common'
import { NotificationsService } from './notifications.service'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list() {
    return this.notifications.list()
  }

  @Post(':id/mark-sent')
  markSent(@Param('id') id: string) {
    return this.notifications.markSent(id)
  }
}
