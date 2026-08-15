interface HeroProps {
  name?: string
  profession?: string
  tagline?: string
}

export function Hero({
  name = '你的名字',
  profession = '你的职业',
  tagline = '一句话介绍你自己',
}: HeroProps) {
  const handleProjectsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!document.getElementById('projects')) {
      e.preventDefault()
    }
  }

  return (
    <section id="home" className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-200 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl dark:text-white">
          {name}
        </h1>
        <p className="mt-4 text-lg text-slate-700 sm:text-xl dark:text-slate-300">
          {profession}
        </p>
        <p className="mt-2 max-w-xl text-base text-slate-600 sm:text-lg dark:text-slate-400">
          {tagline}
        </p>
        <a
          href="#projects"
          onClick={handleProjectsClick}
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700 dark:bg-indigo-400 dark:text-slate-950 dark:hover:bg-indigo-300"
        >
          查看我的项目
        </a>
      </div>
    </section>
  )
}
