import { useEffect, useMemo, useState } from 'react'
import { Card, DotLoading, ErrorBlock, Grid, ProgressBar } from 'antd-mobile'
import { Activity, AlertTriangle, CheckCircle2, Clock3, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { templatesApi } from '../api/templates'
import type { Workflow, WorkflowTemplate } from '../api/types'
import { workflowsApi } from '../api/workflows'
import { FlowCard } from '../components/FlowCard'

export function HomePage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.all([templatesApi.list(), workflowsApi.list()])
      .then(([templateData, workflowData]) => {
        if (!active) return
        setTemplates(templateData)
        setWorkflows(workflowData)
      })
      .catch((err: Error) => {
        if (active) setError(err.message || '首页数据加载失败')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const stuckFlows = useMemo(
    () => workflows.filter((flow) => flow.status === 'overdue' || flow.stuckHours >= 4),
    [workflows],
  )
  const stats = useMemo(() => {
    const running = workflows.filter((flow) => ['pending', 'running', 'overdue'].includes(flow.status)).length
    const overdue = workflows.filter((flow) => flow.status === 'overdue').length
    const pending = workflows.filter((flow) => flow.status === 'pending').length
    const done = workflows.filter((flow) => flow.status === 'done').length

    return [
      { label: '流转中', value: String(running), hint: '正在推进', icon: Activity, tone: 'primary' },
      { label: '待处理', value: String(pending), hint: '需要跟进', icon: Clock3, tone: 'warning' },
      { label: '超时', value: String(overdue), hint: overdue ? '优先处理' : '暂无超时', icon: AlertTriangle, tone: 'danger' },
      { label: '已完成', value: String(done), hint: '流程归档', icon: CheckCircle2, tone: 'success' },
    ]
  }, [workflows])
  const activeTemplateCount = templates.filter((template) => template.status === 'published').length

  return (
    <div className="page home-page">
      <div className="home-board">
        <div className="home-board-head">
          <div>
            <div className="eyebrow">OA 看板</div>
            <h1>整体流程看板</h1>
            <p>流程进度、超时风险和近期动态集中查看。</p>
          </div>
          <span>
            <FileText size={16} />
            {activeTemplateCount} 个模板
          </span>
        </div>

        {loading ? (
          <div className="loading-panel">加载看板中 <DotLoading /></div>
        ) : error ? (
          <ErrorBlock status="default" title="首页加载失败" description={error} />
        ) : (
          <>
            <Grid columns={4} gap={8} className="dashboard-stat-grid">
              {stats.map((item) => {
                const Icon = item.icon
                return (
                  <Grid.Item key={item.label}>
                    <button className={`dashboard-stat-tile is-${item.tone}`} onClick={() => navigate('/tasks')}>
                      <Icon size={17} />
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                      <small>{item.hint}</small>
                    </button>
                  </Grid.Item>
                )
              })}
            </Grid>

            <div className="dashboard-block">
              <div className="dashboard-block-head">
                <strong>超时/积压</strong>
                <span>{stuckFlows.length ? `${stuckFlows.length} 个流程需要关注` : '当前无积压'}</span>
              </div>
              <Card className="compact-panel">
                {stuckFlows.slice(0, 3).length ? (
                  stuckFlows.slice(0, 3).map((flow) => (
                    <button className="queue-row tappable-row" key={flow.id} onClick={() => navigate(`/flow/${flow.id}`)}>
                      <div>
                        <strong>{flow.currentNode}</strong>
                        <span>{flow.title} · {flow.owner} · 已停留 {flow.stuckHours} 小时</span>
                      </div>
                      <ProgressBar percent={Math.min(100, Math.max(12, flow.stuckHours * 8))} />
                    </button>
                  ))
                ) : (
                  <div className="empty-inline">暂无积压节点</div>
                )}
              </Card>
            </div>

            <div className="dashboard-block">
              <div className="dashboard-block-head">
                <strong>最近流程</strong>
                <button type="button" onClick={() => navigate('/tasks')}>查看全部</button>
              </div>
              <div className="stack">
                {workflows.slice(0, 3).map((flow) => (
                  <FlowCard key={flow.id} flow={flow} compact />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
