interface NavigationProps {
  brandName?: string
}

const NAV_LINKS = [
  { href: '#home', label: '首页' },
  { href: '#projects', label: '项目' },
  { href: '#contact', label: '联系我' },
] as const

export function Navigation({ brandName = '你的名字' }: NavigationProps) {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href')
    if (!href || !document.querySelector(href)) {
      e.preventDefault()
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 bg-white/70 backdrop-blur-md dark:bg-slate-950/70">
      <a
        href="#home"
        onClick={handleNavClick}
        className="text-base font-bold tracking-tight text-slate-900 sm:text-lg dark:text-white"
      >
        {brandName}
      </a>
      <ul className="flex list-none items-center gap-4 text-sm sm:text-base">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              onClick={handleNavClick}
              className="font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
