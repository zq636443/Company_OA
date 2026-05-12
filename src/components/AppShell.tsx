import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { TabBar } from 'antd-mobile'
import { CheckSquare, Home, LayoutTemplate, UserRound } from 'lucide-react'

const tabs = [
  { key: '/', title: '首页', icon: Home },
  { key: '/templates', title: '模板', icon: LayoutTemplate },
  { key: '/tasks', title: '待办', icon: CheckSquare },
  { key: '/mine', title: '我的', icon: UserRound },
]

function activeKey(pathname: string) {
  if (pathname.startsWith('/templates')) return '/templates'
  if (pathname.startsWith('/tasks')) return '/tasks'
  if (pathname.startsWith('/mine')) return '/mine'
  return '/'
}

function shouldShowTab(pathname: string) {
  return ['/', '/templates', '/tasks', '/mine'].includes(pathname)
}

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const showTab = shouldShowTab(location.pathname)

  return (
    <div className="app-viewport">
      <main className={showTab ? 'page-with-tabbar' : 'page-without-tabbar'}>
        <Outlet />
      </main>
      {showTab && (
        <div className="bottom-tabbar">
          <TabBar activeKey={activeKey(location.pathname)} onChange={(key) => navigate(key)}>
            {tabs.map((item) => {
              const Icon = item.icon
              return (
                <TabBar.Item
                  key={item.key}
                  title={item.title}
                  icon={<Icon size={21} strokeWidth={2.2} />}
                />
              )
            })}
          </TabBar>
        </div>
      )}
    </div>
  )
}
