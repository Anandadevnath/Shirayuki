import * as React from "react"
import { createContext, useContext, useState, useCallback } from "react"

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((toast) => {
    setToasts((prev) => [...prev, { ...toast, id: Date.now() }])
    setTimeout(() => {
      setToasts((prev) => prev.slice(1))
    }, toast.duration || 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastViewport toasts={toasts} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

export function ToastViewport({ toasts }) {
  return (
    <div className="fixed z-50 bottom-4 right-4 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="bg-black/90 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2 min-w-[200px] max-w-xs">
          <div className="flex-1">
            <div className="font-bold text-sm">{toast.title}</div>
            {toast.description && <div className="text-xs text-gray-300 mt-1">{toast.description}</div>}
          </div>
          <button onClick={() => toast.onClose?.()} className="ml-2 text-gray-400 hover:text-white">✕</button>
        </div>
      ))}
    </div>
  )
}
