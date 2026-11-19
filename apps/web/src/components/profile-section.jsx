export function ProfileSection({
  id,
  title,
  description,
  icon: Icon,
  status,
  children
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6"
    >
      <div className="mb-5 flex items-start gap-3 border-b border-zinc-800 pb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id={`${id}-title`}
              className="text-base font-semibold tracking-tight text-white"
            >
              {title}
            </h2>
            {status !== undefined && (
              <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs font-medium text-zinc-400">
                {status}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}
