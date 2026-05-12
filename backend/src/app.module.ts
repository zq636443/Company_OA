import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './common/prisma/prisma.module'
import { AiModule } from './modules/ai/ai.module'
import { HealthModule } from './modules/health/health.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { TemplatesModule } from './modules/templates/templates.module'
import { WecomModule } from './modules/wecom/wecom.module'
import { WorkflowsModule } from './modules/workflows/workflows.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    TemplatesModule,
    WorkflowsModule,
    NotificationsModule,
    WecomModule,
    AiModule,
  ],
})
export class AppModule {}
