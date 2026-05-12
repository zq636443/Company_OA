import { useEffect, useMemo, useState } from 'react'
import { Button, Card, DotLoading, Empty, ErrorBlock, Tabs, Tag, Toast } from 'antd-mobile'
import { ChevronRight, Clock3, FilePlus2, PencilLine, Rocket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getTemplateIcon } from '../api/icons'
import { templatesApi } from '../api/templates'
import type { WorkflowTemplate } from '../api/types'
import { Section } from '../components/Section'
import { categories } from '../data/mock'

function formatUpdatedAt(value?: string) {
  if (!value) return '刚刚更新'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '刚刚更新'
  return `${date.getMonth() + 1}月${date.getDate()}日更新`
}

export function TemplatesPage() {
  const navigate = useNavigate()
  const [statusTab, setStatusTab] = useState<'published' | 'draft'>('published')
  const [category, setCategory] = useState('全部')
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [publishingId, setPublishingId] = useState('')

  const loadTemplates = () => {
    setLoading(true)
    setError('')
    templatesApi
      .list(true)
      .then((data) => setTemplates(data))
      .catch((err: Error) => {
        setError(err.message || '模板加载失败')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const publishedTemplates = useMemo(
    () => templates.filter((template) => template.status === 'published'),
    [templates],
  )
  const draftTemplates = useMemo(
    () => templates.filter((template) => template.custom && template.status === 'draft'),
    [templates],
  )
  const categoryTabs = useMemo(() => {
    const names = new Set(categories.filter((item) => item !== '全部'))
    publishedTemplates.forEach((template) => {
      if (template.category) names.add(template.category)
    })
    return ['全部', ...names]
  }, [publishedTemplates])
  const visibleTemplates = useMemo(() => {
    return publishedTemplates.filter((template) => {
      const matchCategory = category === '全部' || template.category === category

      return matchCategory
    })
  }, [category, publishedTemplates])

  const publishDraft = async (template: WorkflowTemplate) => {
    const fieldConfigs = template.fieldConfigs ?? []
    const nodes = template.nodes ?? []
    if (!template.name.trim()) {
      Toast.show('模板名称不能为空')
      return
    }
    if (!fieldConfigs.length) {
      Toast.show('发布模板至少需要 1 个字段')
      return
    }
    if (nodes.length < 2) {
      Toast.show('发布模板至少需要 2 个节点')
      return
    }
    if (nodes.some((node) => !node.handler.trim())) {
      Toast.show('每个节点都需要处理人')
      return
    }

    setPublishingId(template.id)
    try {
      await templatesApi.update(template.id, {
        id: template.id,
        name: template.name,
        category: template.category,
        description: template.description,
        duration: template.duration,
        favorite: true,
        status: 'published',
        fieldConfigs,
        nodes,
      })
      Toast.show({ icon: 'success', content: '模板已发布' })
      loadTemplates()
    } catch (err) {
      Toast.show((err as Error).message || '发布失败')
    } finally {
      setPublishingId('')
    }
  }

  return (
    <div className="page templates-page">
      <div className="page-title-row template-page-head">
        <div>
          <div className="eyebrow">模板</div>
          <h1>模板列表</h1>
        </div>
      </div>

      <Tabs
        activeKey={statusTab}
        onChange={(key) => setStatusTab(key as 'published' | 'draft')}
        className="template-status-tabs"
      >
        <Tabs.Tab title={`已发布 ${publishedTemplates.length}`} key="published" />
        <Tabs.Tab title={`草稿 ${draftTemplates.length}`} key="draft" />
      </Tabs>

      {statusTab === 'published' ? (
        <>
          <Tabs activeKey={category} onChange={setCategory} className="category-tabs">
            {categoryTabs.map((item) => (
              <Tabs.Tab title={item} key={item} />
            ))}
          </Tabs>

          <Section title={`${category === '全部' ? '全部模板' : category} · ${visibleTemplates.length}`}>
            {loading ? (
              <div className="loading-panel">加载模板中 <DotLoading /></div>
            ) : error ? (
              <ErrorBlock status="default" title="模板加载失败" description={error} />
            ) : visibleTemplates.length ? (
              <div className="stack">
                {visibleTemplates.map((template) => {
                  const Icon = getTemplateIcon(template.category)
                  return (
                    <Card key={template.id} className="template-card">
                      <div className="template-card-main">
                        <div className="template-icon">
                          <Icon size={23} />
                        </div>
                        <div className="template-card-body">
                          <div className="template-title-line">
                            <strong>{template.name}</strong>
                            {template.custom && <Tag color="primary">自建</Tag>}
                          </div>
                          <p>{template.description}</p>
                          <div className="template-meta">
                            <span>{template.nodeCount} 个节点</span>
                            <span>
                              <Clock3 size={13} />
                              {template.duration}
                            </span>
                            <span>{template.fields.length} 个字段</span>
                          </div>
                          <div className="field-chips">
                            {template.fields.slice(0, 4).map((field) => (
                              <span key={field}>{field}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className={template.custom ? 'template-card-actions has-edit' : 'template-card-actions'}>
                        <Button
                          block
                          color="primary"
                          fill="solid"
                          onClick={() => navigate(`/start/${template.id}`)}
                        >
                          发起流程 <ChevronRight size={16} />
                        </Button>
                        {template.custom && (
                          <Button
                            block
                            fill="outline"
                            onClick={() => navigate(`/admin/templates/${template.id}`)}
                          >
                            <PencilLine size={15} /> 编辑
                          </Button>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Empty description="暂无该分类模板" />
            )}
          </Section>
        </>
      ) : (
        <Section title={`草稿列表 · ${draftTemplates.length}`} className="draft-section">
          {loading ? (
            <div className="loading-panel">加载草稿中 <DotLoading /></div>
          ) : error ? (
            <ErrorBlock status="default" title="草稿加载失败" description={error} />
          ) : draftTemplates.length ? (
            <div className="stack">
              {draftTemplates.map((template) => (
                <Card key={template.id} className="draft-card" onClick={() => navigate(`/admin/templates/${template.id}`)}>
                  <div className="draft-card-head">
                    <div>
                      <strong>{template.name}</strong>
                      <span>{template.category} · {formatUpdatedAt(template.updatedAt)}</span>
                    </div>
                    <Tag color="#8c97a6">草稿</Tag>
                  </div>
                  <p>{template.description || '还没有填写模板说明。'}</p>
                  <div className="draft-card-meta">
                    <span>{template.fields.length} 字段</span>
                    <span>{template.nodeCount} 节点</span>
                    <span>{template.duration}</span>
                  </div>
                  <div className="draft-card-actions">
                    <Button
                      block
                      fill="outline"
                      onClick={(event) => {
                        event.stopPropagation()
                        navigate(`/admin/templates/${template.id}`)
                      }}
                    >
                      <PencilLine size={15} /> 继续编辑
                    </Button>
                    <Button
                      block
                      color="primary"
                      loading={publishingId === template.id}
                      onClick={(event) => {
                        event.stopPropagation()
                        publishDraft(template)
                      }}
                    >
                      <Rocket size={15} /> 发布
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty description="暂无草稿" />
          )}
        </Section>
      )}

      <button
        type="button"
        className="floating-create-template"
        onClick={() => navigate('/admin/templates/new')}
        aria-label="创建模板"
      >
        <FilePlus2 size={22} />
      </button>
    </div>
  )
}
