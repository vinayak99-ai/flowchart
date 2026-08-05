export function TopNav() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-primary-dark bg-primary px-5 text-white shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15 text-sm font-bold">
          F
        </div>
        <span className="text-sm font-semibold tracking-wide">Flowchart Studio</span>
      </div>
      <nav className="flex items-center gap-4 text-xs font-medium text-white/85">
        <span>Local workspace</span>
      </nav>
    </header>
  )
}
