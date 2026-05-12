import { useMemo, useState } from 'react'
import { Button, Card, Form, NavBar, TextArea, Toast } from 'antd-mobile'
import { CheckCircle2, FileText, Paperclip, Send, ShieldAlert, UserRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Section } from '../components/Section'
import { StatusTag } from '../components/StatusTag'
import { workflows } from '../data/mock'

const quickOpinions = ['同意，继续流转', '资料完整', '请补充附件', '风险可控']

export function NodeDetailPage() {
  const navigate = useNavigate()
  const { flowId, nodeId } = useParams()
  const flow = workflows.find((item) => item.id === flowId) ?? workflows[0]
  const node = flow.nodes.find((item) => item.id === nodeId) ?? flow.nodes[0]
  const [opinion, setOpinion] = useState(node.opinion)

  const canEdit = useMemo(() => node.editable || node.status === 'pending' || node.status === 'overdue', [node])

  return (
    <div className="sub-page">
      <NavBar onBack={() => navigate(-1)}>节点详情</NavBar>
      <div className="sub-page-body detail-page">
        <Card className="detail-hero">
          <div className="detail-hero-top">
            <div>
              <div className="eyebrow">{flow.no}</div>
              <h1>{node.name}</h1>
              <p>{flow.title}</p>
            </div>
            <StatusTag status={node.status} />
          </div>
          <div className="detail-hero-meta">
            <span>
              <UserRound size={15} />
              {node.assignee}
            </span>
            <span>
              <CheckCircle2 size={15} />
              {canEdit ? '当前可处理' : '只读查看'}
            </span>
          </div>
        </Card>

        {!canEdit && (
          <div className="readonly-banner">
            <ShieldAlert size={17} />
            当前账号仅可查看本节点信息，不能修改字段。
          </div>
        )}

        <Section title="节点字段">
          <Card className="compact-panel">
            {node.details.map((item) => (
              <div key={item.label} className="detail-row">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="处理意见">
          <Card className="compact-panel">
            <Form layout="vertical">
              <Form.Item label={canEdit ? '填写意见' : '历史意见'}>
                <TextArea
                  value={opinion}
                  onChange={setOpinion}
                  disabled={!canEdit}
                  placeholder="请输入处理意见"
                  autoSize={{ minRows: 3, maxRows: 6 }}
                />
              </Form.Item>
            </Form>
            {canEdit && (
              <div className="opinion-row">
                {quickOpinions.map((item) => (
                  <button key={item} onClick={() => setOpinion(item)}>
                    {item}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </Section>

        <Section title="附件">
          <Card className="compact-panel">
            {node.attachments.length ? (
              node.attachments.map((file) => (
                <button key={file} className="list-entry">
                  <Paperclip size={18} />
                  <span>{file}</span>
                  <strong>查看</strong>
                </button>
              ))
            ) : (
              <div className="empty-inline">暂无附件</div>
            )}
          </Card>
        </Section>

        <Section title="历史记录">
          <Card className="compact-panel">
            <div className="history-item">
              <FileText size={18} />
              <div>
                <strong>{node.assignee} 提交处理</strong>
                <span>{node.time} · {node.opinion || '等待处理意见'}</span>
              </div>
            </div>
          </Card>
        </Section>
      </div>

      <div className="fixed-action-bar">
        <Button block onClick={() => { Toast.show('已暂存') }}>暂存</Button>
        <Button block color="primary" disabled={!canEdit} onClick={() => { Toast.show({ icon: 'success', content: '节点已提交' }) }}>
          <Send size={16} /> 提交节点
        </Button>
      </div>
    </div>
  )
}
