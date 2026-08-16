import { useState } from 'react'
import { ThemeProvider } from './features/theme/ThemeProvider'
import { AuthProvider } from './features/auth/AuthProvider'
import { useAuth } from './features/auth/useAuth'
import { DashboardLayout } from './layouts/DashboardLayout'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ChatPage } from './pages/ChatPage'
import { GoalsPage } from './pages/GoalsPage'
import { LoginPage } from './pages/LoginPage'
import type { NavView } from './components/dashboard/Sidebar'

function AppContent() {
  const { user, loading } = useAuth()
  const [view, setView] = useState<NavView>('analytics')

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
          <svg
            className="h-5 w-5 animate-spin text-indigo-500"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              d="M4 12a8 8 0 018-8"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-75"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <DashboardLayout activeView={view} onNavigate={setView}>
      {view === 'analytics' && <AnalyticsPage />}
      {view === 'chat' && <ChatPage />}
      {view === 'goals' && <GoalsPage />}
    </DashboardLayout>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
