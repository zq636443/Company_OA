import { IsObject, IsOptional, IsString } from 'class-validator'

export class CreateWorkflowDto {
  @IsString()
  templateId: string

  @IsOptional()
  @IsString()
  title?: string

  @IsString()
  initiator: string

  @IsString()
  department: string

  @IsOptional()
  @IsObject()
  values?: Record<string, unknown>
}
