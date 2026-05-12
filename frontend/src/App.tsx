import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { WecomAuthProvider } from './components/WecomAuthProvider'
import { FlowDetailPage } from './pages/FlowDetailPage'
import { HomePage } from './pages/HomePage'
import { MinePage } from './pages/MinePage'
import { NodeDetailPage } from './pages/NodeDetailPage'
import { StartFlowPage } from './pages/StartFlowPage'
import { TemplateAdminPage } from './pages/TemplateAdminPage'
import { TemplateBuilderPage } from './pages/TemplateBuilderPage'
import { TasksPage } from './pages/TasksPage'
import { TemplatesPage } from './pages/TemplatesPage'

function App() {
  return (
    <WecomAuthProvider>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="mine" element={<MinePage />} />
            <Route path="admin/templates" element={<TemplateAdminPage />} />
            <Route path="admin/templates/new" element={<TemplateBuilderPage />} />
            <Route path="admin/templates/:templateId" element={<TemplateBuilderPage />} />
            <Route path="start/:templateId" element={<StartFlowPage />} />
            <Route path="flow/:flowId" element={<FlowDetailPage />} />
            <Route path="flow/:flowId/node/:nodeId" element={<NodeDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WecomAuthProvider>
  )
}

export default App
