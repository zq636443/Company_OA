import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { UpsertTemplateDto } from './dto/upsert-template.dto'
import { TemplatesService } from './templates.service'

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(@Query('includeDrafts') includeDrafts?: string) {
    return this.templates.list(includeDrafts === 'true')
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.templates.get(id)
  }

  @Post()
  create(@Body() dto: UpsertTemplateDto) {
    return this.templates.create(dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpsertTemplateDto) {
    return this.templates.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templates.remove(id)
  }
}
