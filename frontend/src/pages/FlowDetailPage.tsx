import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Dialog, Divider, DotLoading, ErrorBlock, NavBar, Toast } from 'antd-mobile'
import { ChevronRight, FileClock, FileText, Paperclip, RotateCcw, Send, UserRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import type { NodeActionPayload, Workflow } from '../api/types'
import { workflowsApi } from '../api/workflows'
import { Section } from '../components/Section'
import { StatusTag } from '../components/StatusTag'

export function FlowDetailPage() {
  const navigate = useNavigate()
  const { flowId } = useParams()
  const [flow, setFlow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<NodeActionPayload['action'] | ''>('')

  const loadFlow = () => {
    if (!flowId) return
    setLoading(true)
    setError('')
    workflowsApi
      .get(flowId)
      .then(setFlow)
      .catch((err: Error) => setError(err.message || '流程加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadFlow()
  }, [flowId])

  const currentNode = useMemo(
    () => flow?.nodes.find((node) => node.status === 'pending' || node.status === 'overdue') ?? flow?.nodes[0],
    [flow],
  )

  const submitAction = async (action: NodeActionPayload['action'], opinion: string) => {
    if (!flow || !currentNode) return
    setActionLoading(action)
    try {
      const updated = await workflowsApi.act(flow.id, currentNode.id, {
        action,
        actor: '彭总',
        opinion,
      })
      setFlow(updated)
      Toast.show({ icon: 'success', content: action === 'approve' ? '已通过，下一节点已通知' : '操作成功' })
    } catch (err) {
      Toast.show((err as Error).message || '操作失败')
    } finally {
      setActionLoading('')
    }
  }

  const handleApprove = () => {
    Dialog.confirm({
      title: '确认通过当前节点',
      content: '通过后系统会自动通知下一节点处理人。',
      confirmText: '通过',
      onConfirm: async () => {
        await submitAction('approve', '同意，继续流转')
      },
    })
  }

  if (loading) {
    return (
      <div className="sub-page">
        <NavBar onBack={() => navigate(-1)}>流程详情</NavBar>
        <div className="sub-page-body">
          <div className="loading-panel">加载流程中 <DotLoading /></div>
        </div>
      </div>
    )
  }

  if (error || !flow) {
    return (
      <div className="sub-page">
        <NavBar onBack={() => navigate(-1)}>流程详情</NavBar>
        <div className="sub-page-body">
          <ErrorBlock status="default" title="流程加载失败" description={error || '流程不存在'} />
        </div>
      </div>
    )
  }

  return (
    <div className="sub-page">
      <NavBar onBack={() => navigate(-1)}>流程详情</NavBar>
      <div className="sub-page-body detail-page">
        <Card className="detail-hero">
          <div className="detail-hero-top">
            <div>
              <div className="eyebrow">{flow.category}</div>
              <h1>{flow.title}</h1>
              <p>{flow.no}</p>
            </div>
            <StatusTag status={flow.status} />
          </div>
          <div className="detail-hero-meta">
            <span>
              <UserRound size={15} />
              {flow.initiator} · {flow.department}
            </span>
            <span>
              <FileClock size={15} />
              {flow.startedAt}
            </span>
          </div>
        </Card>

        <Section title="关键字段">
          <div className="summary-grid">
            {flow.summary.map((item) => (
              <div key={item.label} className="summary-item">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </Section>

        <Section title="节点时间线">
          <div className="timeline">
            {flow.nodes.map((node) => {
              const current = node.status === 'pending' || node.status === 'overdue'
              return (
                <button
                  key={node.id}
                  className={`timeline-node ${current ? 'is-current' : ''}`}
                  onClick={() => navigate(`/flow/${flow.id}/node/${node.id}`)}
                >
                  <div className="timeline-rail">
                    <span />
                  </div>
                  <div className="timeline-card">
                    <div className="timeline-card-head">
                      <strong>{node.name}</strong>
                      <StatusTag status={node.status} />
                    </div>
                    <div className="timeline-meta">
                      <span>{node.assignee}</span>
                      <span>{node.time}</span>
                      <span>{node.dwell}</span>
                    </div>
                    <div className="node-summary">
                      {node.summary.map((item) => (
                        <span key={item.label}>
                          {item.label}：{item.value}
                        </span>
                      ))}
                    </div>
                    <ChevronRight size={16} className="timeline-arrow" />
                  </div>
                </button>
              )
            })}
          </div>
        </Section>

        <Section title="附件与日志">
          <Card className="compact-panel">
            <button className="list-entry">
              <Paperclip size={18} />
              <span>查看全部附件</span>
              <strong>4 个</strong>
            </button>
            <Divider />
            <button className="list-entry">
              <FileText size={18} />
              <span>操作日志</span>
              <strong>12 条</strong>
            </button>
          </Card>
        </Section>
      </div>

      <div className="fixed-action-bar flow-actions">
        <Button onClick={() => { Toast.show('已暂存处理意见') }}>暂存</Button>
        <Button
          loading={actionLoading === 'return'}
          onClick={() => submitAction('return', '退回发起人补充资料')}
        >
          <RotateCcw size={16} /> 退回
        </Button>
        <Button
          color="danger"
          fill="outline"
          loading={actionLoading === 'reject'}
          onClick={() => submitAction('reject', '不同意，流程驳回')}
        >
          驳回
        </Button>
        <Button color="primary" loading={actionLoading === 'approve'} onClick={handleApprove}>
          <Send size={16} /> 通过
        </Button>
      </div>
    </div>
  )
}
