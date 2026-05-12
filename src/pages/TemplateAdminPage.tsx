import { useEffect, useState } from 'react'
import { Button, Card, Dialog, DotLoading, Empty, ErrorBlock, NavBar, Tag, Toast } from 'antd-mobile'
import { ChevronRight, CopyPlus, FilePlus2, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { templatesApi } from '../api/templates'
import type { WorkflowTemplate } from '../api/types'
import { Section } from '../components/Section'

export function TemplateAdminPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState('')

  const loadTemplates = () => {
    setLoading(true)
    setError('')
    templatesApi
      .list(true)
      .then((data) => setTemplates(data.filter((template) => template.custom)))
      .catch((err: Error) => setError(err.message || '模板加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const handleDelete = (id: string, name: string) => {
    Dialog.confirm({
      title: '删除自定义模板',
      content: `确认删除“${name}”？删除后员工将无法发起这个模板。`,
      confirmText: '删除',
      onConfirm: async () => {
        setDeletingId(id)
        try {
          await templatesApi.remove(id)
          Toast.show({ icon: 'success', content: '已删除模板' })
          loadTemplates()
        } catch (err) {
          Toast.show((err as Error).message || '删除失败')
        } finally {
          setDeletingId('')
        }
      },
    })
  }

  return (
    <div className="sub-page">
      <NavBar onBack={() => navigate(-1)}>流程模板管理</NavBar>
      <div className="sub-page-body admin-page">
        <div className="admin-hero">
          <div>
            <div className="eyebrow">自定义流程</div>
            <h1>创建企业自己的流程模板</h1>
            <p>配置字段、节点、处理人、审批人和抄送人，发布后员工可直接发起。</p>
          </div>
          <CopyPlus size={34} />
        </div>

        <Button block color="primary" size="large" onClick={() => navigate('/admin/templates/new')}>
          <FilePlus2 size={18} /> 新建流程模板
        </Button>

        <Section title="我的自定义模板">
          {loading ? (
            <div className="loading-panel">加载模板中 <DotLoading /></div>
          ) : error ? (
            <ErrorBlock status="default" title="模板加载失败" description={error} />
          ) : templates.length ? (
            <div className="stack">
              {templates.map((template) => (
                <Card key={template.id} className="admin-template-card">
                  <div className="admin-template-head">
                    <div>
                      <strong>{template.name}</strong>
                      <span>{template.category} · {template.nodeCount} 节点 · {template.fields.length} 字段</span>
                    </div>
                    <Tag color={template.status === 'published' ? '#19a35b' : '#8c97a6'}>
                      {template.status === 'published' ? '已发布' : '草稿'}
                    </Tag>
                  </div>
                  <p>{template.description}</p>
                  <div className="admin-template-actions">
                    <Button size="small" onClick={() => navigate(`/admin/templates/${template.id}`)}>
                      编辑 <ChevronRight size={14} />
                    </Button>
                    <Button
                      size="small"
                      fill="outline"
                      color="danger"
                      loading={deletingId === template.id}
                      onClick={() => handleDelete(template.id, template.name)}
                    >
                      <Trash2 size={14} /> 删除
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty description="还没有自定义模板" />
          )}
        </Section>
      </div>
    </div>
  )
}
