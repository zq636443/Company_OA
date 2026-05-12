import { Clock3, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from 'antd-mobile'
import { StatusTag } from './StatusTag'
import type { Workflow } from '../data/mock'

interface FlowCardProps {
  flow: Workflow
  compact?: boolean
}

function formatFlowTime(value: string) {
  const normalized = value.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value.slice(5, 16)

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

export function FlowCard({ flow, compact = false }: FlowCardProps) {
  const navigate = useNavigate()

  return (
    <Card className="flow-card tappable" onClick={() => navigate(`/flow/${flow.id}`)}>
      <div className="flow-card-top">
        <div>
          <div className="flow-title">{flow.title}</div>
          <div className="flow-no">{flow.no}</div>
        </div>
        <StatusTag status={flow.status} />
      </div>
      <div className="flow-meta-grid">
        <span>{flow.category}</span>
        <span>{flow.amount}</span>
        <span>{flow.initiator}</span>
        <span>{formatFlowTime(flow.updatedAt)}</span>
      </div>
      {!compact && (
        <div className="flow-summary">
          {flow.summary.slice(0, 3).map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      )}
      <div className={flow.status === 'overdue' ? 'flow-alert is-danger' : 'flow-alert'}>
        <Clock3 size={15} />
        <span>
          当前 {flow.currentNode}，已停留 {flow.stuckHours} 小时
        </span>
        <UserRound size={15} />
        <span>{flow.owner}</span>
      </div>
    </Card>
  )
}
