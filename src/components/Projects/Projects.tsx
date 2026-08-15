import { PROJECTS, type Project } from './projects-data'

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600">
      <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={project.screenshot}
          alt={`${project.name} 截图`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {project.name}
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {project.description}
        </p>
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            查看源码
          </a>
        )}
      </div>
    </article>
  )
}

export function Projects() {
  return (
    <section id="projects" className="bg-slate-50 py-16 dark:bg-slate-950 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white">
          我的项目
        </h2>
        <p className="mt-3 text-center text-base text-slate-600 dark:text-slate-400">
          这里是我近期做的一些代表性项目
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      </div>
    </section>
  )
}
