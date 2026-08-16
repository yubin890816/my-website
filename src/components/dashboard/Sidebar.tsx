export type NavView = 'analytics' | 'chat' | 'goals'

interface NavItemConfig {
  key: NavView | string
  label: string
  icon: string
  available: boolean
}

const NAV_ITEMS: NavItemConfig[] = [
  { key: 'analytics', label: '学习数据', icon: 'home', available: true },
  { key: 'chat', label: 'AI 对话建议', icon: 'chat', available: true },
  { key: 'goals', label: '学习目标', icon: 'check', available: true },
  { key: 'progress', label: '进度', icon: 'chart', available: false },
  { key: 'insights', label: '建议', icon: 'bulb', available: false },
  { key: 'settings', label: '设置', icon: 'cog', available: false },
]

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    home: 'M3 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9L8 3z',
    check: 'M5 13l4 4L19 7',
    chart: 'M4 19h16M7 16V9m5 7V5m5 11v-6',
    bulb: 'M10 2a6 6 0 00-4 10.5V14a1 1 0 001 1h6a1 1 0 001-1v-1.5A6 6 0 0010 2zM8 17a1 1 0 001 1h2a1 1 0 001-1',
    cog: 'M10 13a3 3 0 100-6 3 3 0 000 6zM10 1v2m0 14v2m9-9h-2M3 10H1m15.07-5.07l-1.41 1.41M5.34 14.66l-1.41 1.41m12.73 0l-1.41-1.41M5.34 5.34L3.93 3.93',
    chat: 'M2 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H7l-5 4V4z',
  }
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 flex-shrink-0"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
  activeView: NavView
  onNavigate: (view: NavView) => void
}

export function Sidebar({ mobileOpen, onClose, activeView, onNavigate }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 transform border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:top-0 lg:h-auto lg:translate-x-0 lg:bg-transparent lg:dark:bg-slate-950 dark:border-slate-800 dark:bg-slate-950 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <nav className="flex h-full flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.available && item.key === activeView
            return (
              <button
                key={item.key}
                type="button"
                disabled={!item.available}
                title={item.available ? item.label : `${item.label}（即将上线）`}
                onClick={() => {
                  if (item.available) onNavigate(item.key as NavView)
                }}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-50 font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : item.available
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                      : 'cursor-not-allowed text-slate-400 dark:text-slate-600'
                }`}
              >
                <NavIcon name={item.icon} />
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
