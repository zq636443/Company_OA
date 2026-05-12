import { IsIn, IsOptional, IsString } from 'class-validator'

export class NodeActionDto {
  @IsIn(['approve', 'reject', 'return', 'transfer'])
  action: 'approve' | 'reject' | 'return' | 'transfer'

  @IsString()
  actor: string

  @IsOptional()
  @IsString()
  opinion?: string

  @IsOptional()
  @IsString()
  transferTo?: string
}
