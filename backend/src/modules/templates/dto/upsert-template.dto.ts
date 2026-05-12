import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator'
import { TemplateFieldDto } from './template-field.dto'
import { TemplateNodeDto } from './template-node.dto'

export class UpsertTemplateDto {
  @IsOptional()
  @IsString()
  id?: string

  @IsString()
  name: string

  @IsString()
  category: string

  @IsString()
  description: string

  @IsString()
  duration: string

  @IsBoolean()
  favorite: boolean

  @IsIn(['draft', 'published'])
  status: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateFieldDto)
  fieldConfigs: TemplateFieldDto[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateNodeDto)
  nodes: TemplateNodeDto[]
}
