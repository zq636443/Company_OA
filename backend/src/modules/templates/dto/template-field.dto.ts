import { IsBoolean, IsIn, IsString } from 'class-validator'

export class TemplateFieldDto {
  @IsString()
  id: string

  @IsString()
  label: string

  @IsIn(['text', 'textarea', 'amount', 'date', 'person', 'attachment'])
  type: string

  @IsBoolean()
  required: boolean

  @IsBoolean()
  showInSummary: boolean
}
