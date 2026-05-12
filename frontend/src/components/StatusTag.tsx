import { Tag } from 'antd-mobile'
import { statusMeta, type StatusKey, type Tone } from '../data/mock'

const colorByTone: Record<Tone, string> = {
  primary: '#1677ff',
  success: '#19a35b',
  warning: '#f59f00',
  danger: '#d92d20',
  neutral: '#8c97a6',
}

interface StatusTagProps {
  status: StatusKey
}

export function StatusTag({ status }: StatusTagProps) {
  const meta = statusMeta[status]

  return (
    <Tag
      color={colorByTone[meta.tone]}
      fill={meta.tone === 'neutral' ? 'outline' : 'solid'}
      className="status-tag"
    >
      {meta.label}
    </Tag>
  )
}
