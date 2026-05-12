import { Avatar, Card, Divider, Switch } from 'antd-mobile'
import { Bell, ChevronRight, CircleHelp, Settings, ShieldCheck } from 'lucide-react'
import { useCurrentUser } from '../components/WecomAuthProvider'
import { myEntries } from '../data/mock'

export function MinePage() {
  const currentUser = useCurrentUser()

  return (
    <div className="page">
      <div className="mine-profile">
        <Avatar src={currentUser.avatar || ''} fallback={currentUser.name.slice(0, 1)} style={{ '--size': '58px', '--border-radius': '8px' }} />
        <div>
          <h1>{currentUser.name}</h1>
          <p>{[currentUser.position, currentUser.departmentName].filter(Boolean).join(' · ') || '流程协作'}</p>
          <span>{currentUser.source === 'wecom' ? '企业微信已登录' : '演示身份'}</span>
        </div>
      </div>

      <div className="mine-entry-grid">
        {myEntries.map((item) => {
          const Icon = item.icon
          return (
            <button key={item.label} className="mine-entry">
              <Icon size={20} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>

      <Card className="compact-panel mine-card">
        <button className="list-entry">
          <Bell size={18} />
          <span>企业微信待办通知</span>
          <Switch defaultChecked />
        </button>
        <Divider />
        <button className="list-entry">
          <ShieldCheck size={18} />
          <span>权限与数据范围</span>
          <strong>全公司</strong>
        </button>
        <Divider />
        <button className="list-entry">
          <Settings size={18} />
          <span>消息设置</span>
          <ChevronRight size={16} />
        </button>
        <Divider />
        <button className="list-entry">
          <CircleHelp size={18} />
          <span>帮助说明</span>
          <ChevronRight size={16} />
        </button>
      </Card>
    </div>
  )
}
