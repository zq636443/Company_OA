import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  DatePicker,
  Dialog,
  ErrorBlock,
  Form,
  Input,
  NavBar,
  Picker,
  TextArea,
  Toast,
} from 'antd-mobile'
import { CalendarDays, Paperclip, UserRoundPlus } from 'lucide-react'
import { templatesApi } from '../api/templates'
import type { FieldType, TemplateFieldConfig, WorkflowTemplate } from '../api/types'
import { workflowsApi } from '../api/workflows'
import { useCurrentUser } from '../components/WecomAuthProvider'

const peopleColumns = [
  [
    { label: '赵启明 · 技术部', value: '赵启明' },
    { label: '刘少鹏 · 业务负责人', value: '刘少鹏' },
    { label: '彭总 · 总经理', value: '彭总' },
    { label: '陈露 · 行政部', value: '陈露' },
  ],
]

export function StartFlowPage() {
  const navigate = useNavigate()
  const { templateId } = useParams()
  const currentUser = useCurrentUser()
  const [form] = Form.useForm()
  const [dateVisible, setDateVisible] = useState(false)
  const [peopleVisible, setPeopleVisible] = useState(false)
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(new Date('2026-05-18'))
  const [reviewer, setReviewer] = useState('赵启明')
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!templateId) return
    let active = true
    setLoading(true)
    setError('')
    templatesApi
      .get(templateId)
      .then((data) => {
        if (active) setTemplate(data)
      })
      .catch((err: Error) => {
        if (active) setError(err.message || '模板加载失败')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [templateId])

  const handleSubmit = async () => {
    if (!template) return
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      const workflow = await workflowsApi.create({
        templateId: template.id,
        title: `${template.name}-${String(values.purpose ?? values.reason ?? values[template.fieldConfigs[0]?.id] ?? '申请')}`,
        initiator: currentUser.name,
        department: currentUser.departmentName || '未设置部门',
        values,
      })
      Toast.show({
        icon: 'success',
        content: '流程已提交，已通知下一节点处理人',
      })
      navigate(`/flow/${workflow.id}`)
    } catch (err) {
      Toast.show((err as Error).message || '流程提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="sub-page">
        <NavBar onBack={() => navigate(-1)}>发起流程</NavBar>
        <div className="sub-page-body">
          <div className="loading-panel">加载模板中</div>
        </div>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="sub-page">
        <NavBar onBack={() => navigate(-1)}>发起流程</NavBar>
        <div className="sub-page-body">
          <ErrorBlock status="default" title="模板加载失败" description={error || '模板不存在'} />
        </div>
      </div>
    )
  }

  const startFieldIds = template.nodes?.[0]?.editableFields ?? []
  const customFields = startFieldIds.length
    ? startFieldIds
        .map((fieldId) => template.fieldConfigs.find((field) => field.id === fieldId))
        .filter(Boolean) as TemplateFieldConfig[]
    : template.fieldConfigs ?? []

  return (
    <div className="sub-page">
      <NavBar onBack={() => navigate(-1)}>发起流程</NavBar>
      <div className="sub-page-body form-page">
        <div className="flow-start-summary">
          <div className="eyebrow">{template.category}</div>
          <h1>{template.name}</h1>
          <p>{template.description}</p>
          <div className="start-meta">
            <span>{template.nodeCount} 个节点</span>
            <span>{template.duration}</span>
            <span>发起人：{currentUser.name}</span>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={
            customFields.length
              ? {}
              : {
                  purpose: '华东售后备件补库',
                  vendor: '上海锐衡机电有限公司',
                  amount: '186500',
                  terms: '30% 预付，70% 验收后付款',
                  afterSales: '核心备件 24 小时响应，故障件 7 日内更换',
                }
          }
          footer={null}
        >
          {customFields.length ? (
            <CustomStartFields fields={customFields} />
          ) : (
            <>
              <div className="form-section-title">基础信息</div>
              <Form.Item name="purpose" label="采购用途" rules={[{ required: true, message: '请输入采购用途' }]}>
                <Input placeholder="请输入采购用途" />
              </Form.Item>
              <Form.Item name="vendor" label="供应商" rules={[{ required: true, message: '请输入供应商' }]}>
                <Input placeholder="请输入供应商名称" />
              </Form.Item>
              <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]}>
                <Input type="number" placeholder="请输入金额" />
              </Form.Item>

              <button type="button" className="selector-row" onClick={() => setDateVisible(true)}>
                <CalendarDays size={18} />
                <span>期望交付日期</span>
                <strong>{deliveryDate?.toLocaleDateString('zh-CN')}</strong>
              </button>

              <div className="form-section-title">付款与风险</div>
              <Form.Item name="terms" label="付款条款" rules={[{ required: true, message: '请输入付款条款' }]}>
                <TextArea placeholder="请输入付款条款" autoSize={{ minRows: 2, maxRows: 5 }} />
              </Form.Item>
              <Form.Item name="risk" label="风险说明">
                <TextArea placeholder="可补充合同、交期、售后等风险" autoSize={{ minRows: 2, maxRows: 5 }} />
              </Form.Item>

              <div className="form-section-title">技术与售后</div>
              <Form.Item name="techParams" label="技术参数" rules={[{ required: true, message: '请输入技术参数' }]}>
                <TextArea placeholder="请输入型号、规格、兼容设备等" autoSize={{ minRows: 3, maxRows: 6 }} />
              </Form.Item>
              <Form.Item name="afterSales" label="售后要求">
                <TextArea placeholder="请输入售后承诺要求" autoSize={{ minRows: 2, maxRows: 5 }} />
              </Form.Item>
            </>
          )}

          <button type="button" className="selector-row" onClick={() => setPeopleVisible(true)}>
            <UserRoundPlus size={18} />
            <span>下一节点处理人</span>
            <strong>{template.nodes?.[1]?.handler || reviewer}</strong>
          </button>

          <div className="form-section-title">附件</div>
          <div className="attachment-uploader" onClick={() => Dialog.alert({ content: '演示原型中已模拟附件上传入口。' })}>
            <Paperclip size={20} />
            <div>
              <strong>上传采购清单、报价单或合同</strong>
              <span>已添加：采购清单.xlsx、供应商报价.pdf</span>
            </div>
          </div>
        </Form>
      </div>

      <div className="fixed-action-bar">
        <Button block onClick={() => { Toast.show('已暂存草稿') }}>暂存草稿</Button>
        <Button block color="primary" loading={submitting} onClick={handleSubmit}>提交</Button>
      </div>

      <DatePicker
        visible={dateVisible}
        value={deliveryDate}
        onClose={() => setDateVisible(false)}
        onConfirm={(value) => setDeliveryDate(value)}
      />
      <Picker
        columns={peopleColumns}
        visible={peopleVisible}
        onClose={() => setPeopleVisible(false)}
        onConfirm={(value) => setReviewer(String(value[0]))}
      />
    </div>
  )
}

function fieldPlaceholder(type: FieldType, label: string) {
  const map: Record<FieldType, string> = {
    text: `请输入${label}`,
    textarea: `请输入${label}`,
    amount: '请输入金额',
    date: '请输入日期，例如 2026-05-18',
    person: '选择企业微信人员',
    attachment: '填写附件说明，正式版接入上传组件',
  }
  return map[type]
}

function CustomStartFields({ fields }: { fields: TemplateFieldConfig[] }) {
  return (
    <>
      <div className="form-section-title">发起节点字段</div>
      {fields.map((field) => (
        <Form.Item
          key={field.id}
          name={field.id}
          label={field.label}
          rules={field.required ? [{ required: true, message: `请填写${field.label}` }] : undefined}
        >
          {field.type === 'textarea' || field.type === 'attachment' ? (
            <TextArea placeholder={fieldPlaceholder(field.type, field.label)} autoSize={{ minRows: 2, maxRows: 6 }} />
          ) : (
            <Input
              type={field.type === 'amount' ? 'number' : 'text'}
              placeholder={fieldPlaceholder(field.type, field.label)}
            />
          )}
        </Form.Item>
      ))}
    </>
  )
}
