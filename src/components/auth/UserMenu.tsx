import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../features/auth/useAuth'

function getInitial(email: string | undefined): string {
  if (!email) return '?'
  const ch = email.trim().charAt(0)
  return ch ? ch.toUpperCase() : '?'
}

function getEmailPrefix(email: string | undefined): string {
  if (!email) return ''
  const i = email.indexOf('@')
  return i > 0 ? email.slice(0, i) : email
}

export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [open])

  function handleProfileClick() {
    setOpen(false)
    // 无路由，滚动到 OverviewPage 顶部的 ProfileBadge
    const el = document.getElementById('profile-badge')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleLogoutClick() {
    setOpen(false)
    logout()
  }

  if (!user) {
    // Topbar 未登录时不渲染入口（访问守卫已确保未登录看不到 Topbar）
    return null
  }

  const initial = getInitial(user.email)

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="用户菜单"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white dark:bg-indigo-500">
          {initial}
        </span>
        <span className="hidden text-sm font-medium text-slate-700 sm:inline dark:text-slate-300">
          {getEmailPrefix(user.email)}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <button
            type="button"
            onClick={handleProfileClick}
            role="menuitem"
            className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Profile
          </button>
          <button
            type="button"
            onClick={handleLogoutClick}
            role="menuitem"
            className="block w-full border-t border-slate-100 px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            登出
          </button>
        </div>
      )}
    </div>
  )
}
