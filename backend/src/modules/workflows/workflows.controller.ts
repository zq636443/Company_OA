import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { CreateWorkflowDto } from './dto/create-workflow.dto'
import { NodeActionDto } from './dto/node-action.dto'
import { WorkflowsService } from './workflows.service'

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflows: WorkflowsService) {}

  @Get()
  list() {
    return this.workflows.list()
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.workflows.get(id)
  }

  @Post()
  create(@Body() dto: CreateWorkflowDto) {
    return this.workflows.create(dto)
  }

  @Post(':id/nodes/:nodeId/action')
  act(@Param('id') id: string, @Param('nodeId') nodeId: string, @Body() dto: NodeActionDto) {
    return this.workflows.act(id, nodeId, dto)
  }
}
