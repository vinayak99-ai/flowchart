import { createContext, useContext, type ReactNode } from "react"

export type ViewMode = "read" | "edit"

// Default "edit" so components used outside a provider behave exactly as
// they did before read mode existed.
const ViewModeContext = createContext<ViewMode>("edit")

export function ViewModeProvider({ mode, children }: { mode: ViewMode; children: ReactNode }) {
  return <ViewModeContext.Provider value={mode}>{children}</ViewModeContext.Provider>
}

export function useViewMode(): ViewMode {
  return useContext(ViewModeContext)
}
