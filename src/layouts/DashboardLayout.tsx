import { useState, type ReactNode } from 'react'
import { Sidebar, type NavView } from '../components/dashboard/Sidebar'
import { Topbar } from '../components/dashboard/Topbar'

interface DashboardLayoutProps {
  children: ReactNode
  activeView: NavView
  onNavigate: (view: NavView) => void
}

export function DashboardLayout({ children, activeView, onNavigate }: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Topbar onMenuClick={() => setMobileSidebarOpen(true)} />
      <div className="flex">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          activeView={activeView}
          onNavigate={(view) => {
            onNavigate(view)
            setMobileSidebarOpen(false)
          }}
        />
        <main
          className="flex-1 overflow-y-auto px-4 py-6 lg:px-6"
          style={{ minHeight: 'calc(100vh - 4rem)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
