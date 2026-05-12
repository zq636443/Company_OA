import { IsArray, IsIn, IsOptional, IsString } from 'class-validator'

export class TemplateNodeDto {
  @IsString()
  id: string

  @IsString()
  name: string

  @IsIn(['填写', '审核', '审批', '抄送', '用印', '归档'])
  type: string

  @IsString()
  handler: string

  @IsString()
  approver: string

  @IsString()
  cc: string

  @IsOptional()
  @IsArray()
  handlerUsers?: unknown[]

  @IsOptional()
  @IsArray()
  approverUsers?: unknown[]

  @IsOptional()
  @IsArray()
  ccUsers?: unknown[]

  @IsArray()
  editableFields: string[]

  @IsArray()
  summaryFields: string[]
}
