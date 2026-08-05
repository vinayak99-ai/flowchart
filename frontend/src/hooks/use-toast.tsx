import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react"
import { ToastViewport } from "@/components/ui/toast"

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: "default" | "destructive"
  action?: ToastAction
}

type ToastInput = Omit<ToastItem, "id">

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null)

const AUTO_DISMISS_MS = 4000
// Toasts with an action (e.g. Undo) stay longer so the user can react.
const ACTION_DISMISS_MS = 8000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `toast-${++counter.current}`
      setToasts((prev) => [...prev, { ...input, id }])
      setTimeout(() => dismiss(id), input.action ? ACTION_DISMISS_MS : AUTO_DISMISS_MS)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const toast = useContext(ToastContext)
  if (!toast) throw new Error("useToast must be used within a ToastProvider")
  return toast
}
