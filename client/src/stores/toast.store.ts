import { defineStore } from 'pinia'

export type ToastKind = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  kind: ToastKind
  text: string
  timeout: number
}

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: [] as ToastItem[],
  }),
  actions: {
    push(kind: ToastKind, text: string, timeout = 3000) {
      const id = Date.now() + Math.random()
      this.items.push({ id, kind, text, timeout })
      window.setTimeout(() => this.remove(id), timeout)
    },
    success(text: string, timeout = 3000) { this.push('success', text, timeout) },
    error(text: string, timeout = 4000) { this.push('error', text, timeout) },
    info(text: string, timeout = 3000) { this.push('info', text, timeout) },
    remove(id: number) { this.items = this.items.filter(t => t.id !== id) },
  },
})
