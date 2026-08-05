const SPEC_BUILDER_URL = import.meta.env.VITE_PM_PORTAL_URL ?? 'http://localhost:5174'

export function SpecBuilderPanel() {
  return (
    <iframe
      title="Spec Builder"
      src={SPEC_BUILDER_URL}
      className="h-full w-full flex-1 border-0"
    />
  )
}
