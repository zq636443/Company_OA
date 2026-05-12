import { Module } from '@nestjs/common'
import { NotificationsModule } from '../notifications/notifications.module'
import { TemplatesModule } from '../templates/templates.module'
import { WorkflowsController } from './workflows.controller'
import { WorkflowsService } from './workflows.service'

@Module({
  imports: [TemplatesModule, NotificationsModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
})
export class WorkflowsModule {}
