import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, ErrorBlock, Form, Input, NavBar, Selector, Switch, TextArea, Toast } from 'antd-mobile'
import {
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  Layers3,
  Plus,
  Settings2,
  Trash2,
} from 'lucide-react'
import { templatesApi } from '../api/templates'
import type { FieldType, TemplateFieldConfig, TemplateNodeConfig, UpsertWorkflowTemplate } from '../api/types'
import { WecomPersonSelector } from '../components/WecomPersonSelector'
import { categories } from '../data/mock'

type BuilderStep = 'basic' | 'nodes' | 'preview'

const steps: Array<{ key: BuilderStep; label: string; icon: typeof Settings2 }> = [
  { key: 'basic', label: '基础', icon: Settings2 },
  { key: 'nodes', label: '节点', icon: Layers3 },
  { key: 'preview', label: '预览', icon: CheckCircle2 },
]

const fieldTypeOptions: Array<{ label: string; value: FieldType }> = [
  { label: '文本', value: 'text' },
  { label: '多行', value: 'textarea' },
  { label: '金额', value: 'amount' },
  { label: '日期', value: 'date' },
  { label: '人员', value: 'person' },
  { label: '附件', value: 'attachment' },
]

const nodeTypeOptions: Array<{ label: TemplateNodeConfig['type']; value: TemplateNodeConfig['type'] }> = [
  { label: '填写', value: '填写' },
  { label: '审核', value: '审核' },
  { label: '审批', value: '审批' },
  { label: '抄送', value: '抄送' },
  { label: '用印', value: '用印' },
  { label: '归档', value: '归档' },
]

function newField(label = '新字段'): TemplateFieldConfig {
  const id = `field-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  return {
    id,
    label,
    type: 'text',
    required: false,
    showInSummary: false,
  }
}

function newNode(name = '新节点'): TemplateNodeConfig {
  return {
    id: `node-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    type: '审批',
    handler: '刘少鹏',
    approver: '刘少鹏',
    cc: '彭总',
    editableFields: [],
    summaryFields: [],
  }
}

function createTemplateId() {
  return `custom-${Date.now().toString(36)}`
}

function createDefaultTemplateConfig() {
  const defaultFields: TemplateFieldConfig[] = [
    { ...newField('申请事由'), type: 'textarea', required: true, showInSummary: true },
    { ...newField('供应商/相对方'), required: true, showInSummary: true },
    { ...newField('金额'), type: 'amount', required: true, showInSummary: true },
    { ...newField('附件材料'), type: 'attachment', required: false, showInSummary: false },
  ]
  const summaryFields = defaultFields.filter((field) => field.showInSummary).map((field) => field.id)
  const defaultFieldIds = defaultFields.map((field) => field.id)

  return {
    fields: defaultFields,
    nodes: [
      {
        id: 'node-start',
        name: '发起申请',
        type: '填写',
        handler: '发起人',
        approver: '',
        cc: '',
        editableFields: defaultFieldIds,
        summaryFields,
      },
      {
        id: 'node-finance',
        name: '财务审核付款条款',
        type: '审核',
        handler: '林雅',
        approver: '林雅',
        cc: '彭总',
        editableFields: [],
        summaryFields: [],
      },
      {
        id: 'node-legal',
        name: '法务/行政审核风险',
        type: '审核',
        handler: '吴桐',
        approver: '吴桐',
        cc: '陈露',
        editableFields: [],
        summaryFields: [],
      },
    ] satisfies TemplateNodeConfig[],
  }
}

export function TemplateBuilderPage() {
  const navigate = useNavigate()
  const { templateId } = useParams()
  const [initialConfig] = useState(createDefaultTemplateConfig)

  const [activeStep, setActiveStep] = useState<BuilderStep>('basic')
  const [activeNodeId, setActiveNodeId] = useState('node-start')
  const [name, setName] = useState('采购/合同联合审批')
  const [category, setCategory] = useState('采购')
  const [duration, setDuration] = useState('约 2 天')
  const [description, setDescription] = useState(
    '用于采购、合同、付款条款、风险审核和用印归档的多节点流程。',
  )
  const [fields, setFields] = useState<TemplateFieldConfig[]>(initialConfig.fields)
  const [nodes, setNodes] = useState<TemplateNodeConfig[]>(initialConfig.nodes)
  const [loadingTemplate, setLoadingTemplate] = useState(Boolean(templateId))
  const [loadError, setLoadError] = useState('')
  const [savingStatus, setSavingStatus] = useState<'draft' | 'published' | ''>('')

  useEffect(() => {
    if (!templateId) return
    let active = true
    setLoadingTemplate(true)
    setLoadError('')
    templatesApi
      .get(templateId)
      .then((template) => {
        if (!active) return
        setName(template.name)
        setCategory(template.category)
        setDuration(template.duration)
        setDescription(template.description)
        setFields(template.fieldConfigs)
        setNodes(template.nodes)
        setActiveNodeId(template.nodes[1]?.id ?? template.nodes[0]?.id ?? 'node-start')
      })
      .catch((err: Error) => {
        if (active) setLoadError(err.message || '模板加载失败')
      })
      .finally(() => {
        if (active) setLoadingTemplate(false)
      })
    return () => {
      active = false
    }
  }, [templateId])

  const usedFieldIds = Array.from(new Set(nodes.flatMap((node) => [...node.editableFields, ...node.summaryFields])))
  const usedFields = usedFieldIds.map((id) => fields.find((field) => field.id === id)).filter(Boolean) as TemplateFieldConfig[]
  const activeNode = nodes.find((node) => node.id === activeNodeId) ?? nodes[0]
  const activeNodeIndex = nodes.findIndex((node) => node.id === activeNode.id)
  const activeNodeFields = activeNode.editableFields
    .map((id) => fields.find((field) => field.id === id))
    .filter(Boolean) as TemplateFieldConfig[]

  const updateField = (id: string, patch: Partial<TemplateFieldConfig>) => {
    setFields((current) => current.map((field) => (field.id === id ? { ...field, ...patch } : field)))
  }

  const removeOrphanField = (id: string, nextNodes: TemplateNodeConfig[]) => {
    const stillUsed = nextNodes.some((node) => node.editableFields.includes(id) || node.summaryFields.includes(id))
    if (!stillUsed) {
      setFields((current) => current.filter((field) => field.id !== id))
    }
  }

  const addNodeField = (nodeId: string) => {
    const field = newField()
    setFields((current) => [...current, field])
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              editableFields: [...node.editableFields, field.id],
            }
          : node,
      ),
    )
  }

  const removeNodeField = (nodeId: string, fieldId: string) => {
    setNodes((current) => {
      const next = current.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              editableFields: node.editableFields.filter((id) => id !== fieldId),
              summaryFields: node.summaryFields.filter((id) => id !== fieldId),
            }
          : node,
      )
      removeOrphanField(fieldId, next)
      return next
    })
  }

  const updateNode = (id: string, patch: Partial<TemplateNodeConfig>) => {
    setNodes((current) => current.map((node) => (node.id === id ? { ...node, ...patch } : node)))
  }

  const addNode = () => {
    const node = newNode()
    setNodes((current) => [...current, node])
    setActiveNodeId(node.id)
    setActiveStep('nodes')
  }

  const removeNode = (id: string) => {
    setNodes((current) => {
      const next = current.filter((node, index) => index === 0 || node.id !== id)
      if (activeNodeId === id) {
        setActiveNodeId(next[1]?.id ?? next[0]?.id)
      }
      return next
    })
  }

  const toggleNodeSummaryField = (nodeId: string, fieldId: string, checked: boolean) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              summaryFields: checked
                ? Array.from(new Set([...node.summaryFields, fieldId]))
                : node.summaryFields.filter((id) => id !== fieldId),
            }
          : node,
      ),
    )
  }

  const buildTemplate = (status: UpsertWorkflowTemplate['status']): UpsertWorkflowTemplate => ({
    id: templateId ?? createTemplateId(),
    name: name.trim(),
    category,
    description: description.trim(),
    duration: duration.trim() || '约 1 天',
    favorite: status === 'published',
    status,
    fieldConfigs: usedFields.map((field) => ({ ...field, label: field.label.trim() || '未命名字段' })),
    nodes: nodes.map((node) => ({
      ...node,
      name: node.name.trim() || '未命名节点',
      handler: node.handler.trim() || '待指定',
      approver: node.approver.trim(),
      cc: node.cc.trim(),
    })),
  })

  const saveTemplate = async (status: UpsertWorkflowTemplate['status']) => {
    if (!name.trim()) {
      setActiveStep('basic')
      Toast.show('请输入流程名称')
      return
    }
    if (status === 'published') {
      if (!usedFields.length) {
        setActiveStep('nodes')
        Toast.show('至少配置 1 个字段')
        return
      }
      if (nodes.length < 2) {
        setActiveStep('nodes')
        Toast.show('发布模板至少需要 2 个节点')
        return
      }
      if (nodes.some((node) => !node.handler.trim())) {
        setActiveStep('nodes')
        Toast.show('每个节点都需要处理人')
        return
      }
    }

    setSavingStatus(status)
    try {
      const payload = buildTemplate(status)
      if (templateId) {
        await templatesApi.update(templateId, payload)
      } else {
        await templatesApi.create(payload)
      }
      Toast.show({
        icon: 'success',
        content: status === 'published' ? '模板已发布' : '草稿已保存',
      })
      navigate('/templates')
    } catch (err) {
      Toast.show((err as Error).message || '保存失败')
    } finally {
      setSavingStatus('')
    }
  }

  if (loadingTemplate) {
    return (
      <div className="sub-page">
        <NavBar onBack={() => navigate(-1)}>编辑流程模板</NavBar>
        <div className="sub-page-body">
          <div className="loading-panel">加载模板中</div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="sub-page">
        <NavBar onBack={() => navigate(-1)}>编辑流程模板</NavBar>
        <div className="sub-page-body">
          <ErrorBlock status="default" title="模板加载失败" description={loadError} />
        </div>
      </div>
    )
  }

  return (
    <div className="sub-page">
      <NavBar onBack={() => navigate(-1)}>{templateId ? '编辑流程模板' : '新建流程模板'}</NavBar>
      <div className="sub-page-body builder-page builder-page-v2">
        <div className="builder-overview">
          <div className="builder-overview-title">
            <ClipboardList size={24} />
            <div>
              <div className="eyebrow">流程设计器</div>
              <h1>{name || '未命名流程'}</h1>
            </div>
          </div>
          <p>{description || '配置流程说明后，员工发起时会看到这段描述。'}</p>
          <div className="builder-kpi-row">
            <span>{category}</span>
            <span>{usedFields.length} 字段</span>
            <span>{nodes.length} 节点</span>
            <span>{duration}</span>
          </div>
        </div>

        <div className="builder-step-nav" aria-label="配置步骤">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <button
                key={step.key}
                type="button"
                className={activeStep === step.key ? 'is-active' : ''}
                onClick={() => setActiveStep(step.key)}
              >
                <Icon size={17} />
                <span>{step.label}</span>
              </button>
            )
          })}
        </div>

        {activeStep === 'basic' && (
          <Card className="builder-panel">
            <div className="builder-panel-head">
              <div>
                <strong>基础信息</strong>
                <span>先把模板名字、分类和发起说明定下来。</span>
              </div>
            </div>
            <Form layout="vertical">
              <Form.Item label="流程名称">
                <Input value={name} onChange={setName} placeholder="请输入流程名称" />
              </Form.Item>
              <Form.Item label="模板说明">
                <TextArea value={description} onChange={setDescription} autoSize={{ minRows: 3, maxRows: 6 }} />
              </Form.Item>
              <Form.Item label="预计时长">
                <Input value={duration} onChange={setDuration} placeholder="例如：约 2 天" />
              </Form.Item>
            </Form>
            <div className="inline-label">模板分类</div>
            <Selector
              value={[category]}
              onChange={(value) => setCategory(String(value[0] ?? category))}
              options={categories.filter((item) => item !== '全部').map((item) => ({ label: item, value: item }))}
              columns={4}
              showCheckMark={false}
            />
          </Card>
        )}

        {activeStep === 'nodes' && (
          <Card className="builder-panel">
            <div className="builder-panel-head">
              <div>
                <strong>流程节点</strong>
                <span>先点选节点，再配置这个节点需要填写和展示的字段。</span>
              </div>
              <Button size="small" color="primary" fill="outline" onClick={addNode}>
                <Plus size={14} /> 节点
              </Button>
            </div>

            <div className="node-rail-v2">
              {nodes.map((node, index) => (
                <button
                  key={node.id}
                  type="button"
                  className={activeNode.id === node.id ? 'is-active' : ''}
                  onClick={() => setActiveNodeId(node.id)}
                >
                  <span>{index + 1}</span>
                  <strong>{node.name || '未命名节点'}</strong>
                  <small>{node.type}</small>
                </button>
              ))}
            </div>

            <div className="active-node-panel">
              <div className="active-node-head">
                <div>
                  <span>当前编辑节点</span>
                  <strong>{activeNodeIndex + 1}. {activeNode.name || '未命名节点'}</strong>
                </div>
                {activeNodeIndex > 0 && (
                  <Button size="mini" fill="outline" color="danger" onClick={() => removeNode(activeNode.id)}>
                    删除
                  </Button>
                )}
              </div>

              <Input value={activeNode.name} onChange={(value) => updateNode(activeNode.id, { name: value })} placeholder="节点名称" />
              <Selector
                value={[activeNode.type]}
                onChange={(value) => updateNode(activeNode.id, { type: value[0] as TemplateNodeConfig['type'] })}
                options={nodeTypeOptions}
                columns={3}
                showCheckMark={false}
              />

              <div className="node-person-box">
                <WecomPersonSelector
                  label="处理人"
                  value={activeNode.handler}
                  selectedUsers={activeNode.handlerUsers}
                  onChange={(value, users) => updateNode(activeNode.id, { handler: value, handlerUsers: users })}
                />
                <WecomPersonSelector
                  label="审批人"
                  value={activeNode.approver}
                  selectedUsers={activeNode.approverUsers}
                  placeholder="审批人，可为空"
                  onChange={(value, users) => updateNode(activeNode.id, { approver: value, approverUsers: users })}
                />
                <WecomPersonSelector
                  label="抄送"
                  value={activeNode.cc}
                  selectedUsers={activeNode.ccUsers}
                  placeholder="抄送人/部门，可为空"
                  onChange={(value, users) => updateNode(activeNode.id, { cc: value, ccUsers: users })}
                />
              </div>

              <div className="field-picker-group">
                <div className="field-map-title">本节点字段</div>
                <div className="field-list-v2">
                  {activeNodeFields.map((field, index) => (
                    <div key={field.id} className="field-card-v2">
                      <div className="field-card-top">
                        <div>
                          <span>字段 {index + 1}</span>
                          <strong>{field.label || '未命名字段'}</strong>
                        </div>
                        <Button size="mini" fill="none" color="danger" onClick={() => removeNodeField(activeNode.id, field.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <Input value={field.label} onChange={(value) => updateField(field.id, { label: value })} placeholder="字段名称" />
                      <Selector
                        value={[field.type]}
                        onChange={(value) => updateField(field.id, { type: value[0] as FieldType })}
                        options={fieldTypeOptions}
                        columns={3}
                        showCheckMark={false}
                      />
                      <div className="field-card-flags">
                        <label>
                          <span>必填</span>
                          <Switch checked={field.required} onChange={(checked) => updateField(field.id, { required: checked })} />
                        </label>
                        <label>
                          <span>节点展示</span>
                          <Switch
                            checked={activeNode.summaryFields.includes(field.id)}
                            onChange={(checked) => toggleNodeSummaryField(activeNode.id, field.id, checked)}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <Button color="primary" fill="outline" onClick={() => addNodeField(activeNode.id)}>
                  <Plus size={14} /> 添加字段
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeStep === 'preview' && (
          <Card className="builder-panel">
            <div className="builder-panel-head">
              <div>
                <strong>发布预览</strong>
                <span>确认员工发起流程和查看详情时看到的核心内容。</span>
              </div>
            </div>

            <div className="template-preview-v2">
              <div className="template-preview-title">
                <FilePlus2 size={19} />
                <div>
                  <strong>{name || '未命名流程'}</strong>
                  <span>{category} · {usedFields.length} 字段 · {nodes.length} 节点 · {duration}</span>
                </div>
              </div>
              <p>{description}</p>
            </div>

            <div className="publish-checklist">
              <div className={name.trim() ? 'is-ok' : ''}>
                <CheckCircle2 size={16} />
                <span>流程名称</span>
              </div>
              <div className={usedFields.length ? 'is-ok' : ''}>
                <CheckCircle2 size={16} />
                <span>至少 1 个字段</span>
              </div>
              <div className={nodes.length >= 2 ? 'is-ok' : ''}>
                <CheckCircle2 size={16} />
                <span>至少 2 个节点</span>
              </div>
              <div className={nodes.every((node) => node.handler.trim()) ? 'is-ok' : ''}>
                <CheckCircle2 size={16} />
                <span>节点处理人完整</span>
              </div>
            </div>

            <div className="preview-flow-line">
              {nodes.map((node, index) => (
                <div key={node.id} className="preview-node-line">
                  <span>{index + 1}</span>
                  <div>
                    <strong>{node.name || '未命名节点'}</strong>
                    <small>{node.type} · 处理人：{node.handler || '待指定'}</small>
                    <em>
                      展示：
                      {node.summaryFields
                        .map((id) => fields.find((field) => field.id === id)?.label)
                        .filter(Boolean)
                        .join('、') || '未选择字段'}
                    </em>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeStep !== 'preview' && (
          <button type="button" className="next-step-card" onClick={() => setActiveStep(nextStep(activeStep))}>
            下一步：{steps.find((step) => step.key === nextStep(activeStep))?.label}
          </button>
        )}
      </div>

      <div className="fixed-action-bar builder-actions">
        <Button block loading={savingStatus === 'draft'} disabled={Boolean(savingStatus)} onClick={() => saveTemplate('draft')}>保存草稿</Button>
        <Button block color="primary" loading={savingStatus === 'published'} disabled={Boolean(savingStatus)} onClick={() => saveTemplate('published')}>发布</Button>
      </div>
    </div>
  )
}

function nextStep(step: BuilderStep): BuilderStep {
  if (step === 'basic') return 'nodes'
  return 'preview'
}
