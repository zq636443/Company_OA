import { useEffect, useMemo, useState } from 'react'
import { DotLoading, Empty, ErrorBlock, SearchBar, Selector, Tabs } from 'antd-mobile'
import type { Workflow } from '../api/types'
import { workflowsApi } from '../api/workflows'
import { FlowCard } from '../components/FlowCard'
import { Section } from '../components/Section'

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '采购', value: '采购' },
  { label: '财务', value: '财务' },
  { label: '用印', value: '用印' },
  { label: '法务', value: '法务' },
]

export function TasksPage() {
  const [tab, setTab] = useState('todo')
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<string[]>(['all'])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    workflowsApi
      .list()
      .then((data) => {
        if (active) setWorkflows(data)
      })
      .catch((err: Error) => {
        if (active) setError(err.message || '流程加载失败')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const visibleFlows = useMemo(() => {
    return workflows.filter((flow) => {
      const matchTab =
        tab === 'todo'
          ? ['pending', 'overdue', 'running'].includes(flow.status)
          : tab === 'done'
            ? flow.status === 'done'
            : ['running', 'done', 'overdue'].includes(flow.status)
      const activeFilter = filter[0] ?? 'all'
      const matchFilter = activeFilter === 'all' || flow.category === activeFilter
      const matchKeyword =
        !keyword ||
        `${flow.title}${flow.no}${flow.initiator}${flow.vendor}${flow.currentNode}`.includes(keyword)

      return matchTab && matchFilter && matchKeyword
    })
  }, [filter, keyword, tab])

  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">我的流程</div>
          <h1>待办 / 已办 / 抄送</h1>
        </div>
      </div>

      <SearchBar
        value={keyword}
        onChange={setKeyword}
        placeholder="搜索流程、编号、发起人"
        className="page-search"
      />

      <Tabs activeKey={tab} onChange={setTab} className="category-tabs">
        <Tabs.Tab title="待我处理" key="todo" />
        <Tabs.Tab title="已处理" key="done" />
        <Tabs.Tab title="抄送我" key="cc" />
      </Tabs>

      <div className="filter-strip">
        <Selector
          value={filter}
          onChange={(value) => setFilter(value.length ? value : ['all'])}
          options={filterOptions}
          columns={5}
          showCheckMark={false}
        />
      </div>

      <Section title={tab === 'todo' ? '当前待处理' : tab === 'done' ? '处理记录' : '抄送流程'}>
        {loading ? (
          <div className="loading-panel">加载流程中 <DotLoading /></div>
        ) : error ? (
          <ErrorBlock status="default" title="流程加载失败" description={error} />
        ) : visibleFlows.length ? (
          <div className="stack">
            {visibleFlows.map((flow) => (
              <FlowCard key={flow.id} flow={flow} />
            ))}
          </div>
        ) : (
          <Empty description="暂无匹配流程" />
        )}
      </Section>
    </div>
  )
}
