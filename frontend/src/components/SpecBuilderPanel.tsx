import { SpecBuilderApp } from '../features/spec-builder/SpecBuilderApp'

export function SpecBuilderPanel() {
  return (
    <div className="h-full w-full flex-1 overflow-y-auto">
      <SpecBuilderApp />
    </div>
  )
}
