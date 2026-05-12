import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  status() {
    return {
      configured: Boolean(this.config.get<string>('OPENAI_API_KEY')),
      plannedCapabilities: [
        'natural-language-template-generation',
        'workflow-summary',
        'contract-risk-extraction',
        'approval-opinion-draft',
      ],
      guardrails: ['structured-output', 'human-confirmation-before-write', 'audit-log'],
    }
  }
}
