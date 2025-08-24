import { defineStore } from 'pinia'

function headers(): HeadersInit {
  const token = localStorage.getItem('token')
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export type CheckinStatus = 'on_track' | 'blocked' | 'done'

export interface ShareEntry {
  id: number
  buddy_id: number
  email: string
  permissions: 'view' | 'checkin'
  created_at: string
}
export interface CheckinEntry {
  id: number
  goal_id: number
  user_id: number
  status: CheckinStatus
  progress: number | null
  note: string | null
  created_at: string
}
export interface MessageEntry {
  id: number
  goal_id: number
  sender_id: number
  body: string
  created_at: string
  email?: string
}
export interface SharedGoal {
  id: number
  user_id: number
  title: string
  description: string | null
  target_date: string | null
  status: 'in_progress' | 'completed' | 'abandoned'
  created_at: string
  category: string | null
  tags: string | null
  color: string | null
}

export const useCollabStore = defineStore('collab', {
  state: () => ({
    shared: [] as SharedGoal[],
    sharedTotal: 0,
    sharedPage: 1,
    sharedPages: 1,

    shares: {} as Record<number, ShareEntry[]>,
    checkins: {} as Record<number, CheckinEntry[]>,
    messages: {} as Record<number, MessageEntry[]>,
  }),
  actions: {
    async listShared(params: { page?: number; pageSize?: number; q?: string; sort?: string; category?: string; status?: string } = {}) {
      const qs = new URLSearchParams()
      if (params.page) qs.set('page', String(params.page))
      if (params.pageSize) qs.set('pageSize', String(params.pageSize))
      if (params.q) qs.set('q', params.q)
      if (params.sort) qs.set('sort', params.sort)
      if (params.category) qs.set('category', params.category)
      if (params.status) qs.set('status', params.status)
      const r = await fetch(`/api/goals/shared?${qs.toString()}`, { headers: headers() })
      const j = await r.json()
      this.shared = j.data as SharedGoal[]
      this.sharedTotal = j.total as number
      this.sharedPage = j.page as number
      this.sharedPages = j.totalPages as number
    },

    async getShares(goalId: number) {
      const r = await fetch(`/api/goals/${goalId}/shares`, { headers: headers() })
      this.shares[goalId] = r.ok ? ((await r.json()) as ShareEntry[]) : []
    },
    async share(goalId: number, email: string, permissions: 'view' | 'checkin' = 'checkin') {
      await fetch(`/api/goals/${goalId}/share`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ email, permissions }),
      })
      await this.getShares(goalId)
    },
    async revokeShare(goalId: number, buddyId: number) {
      await fetch(`/api/goals/${goalId}/share/${buddyId}`, { method: 'DELETE', headers: headers() })
      await this.getShares(goalId)
    },

    async listCheckins(goalId: number) {
      const r = await fetch(`/api/goals/${goalId}/checkins`, { headers: headers() })
      this.checkins[goalId] = r.ok ? ((await r.json()) as CheckinEntry[]) : []
    },
    async addCheckin(goalId: number, payload: { status?: CheckinStatus; progress?: number | null; note?: string }) {
      await fetch(`/api/goals/${goalId}/checkins`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload),
      })
      await this.listCheckins(goalId)
    },

    async listMessages(goalId: number) {
      const r = await fetch(`/api/goals/${goalId}/messages`, { headers: headers() })
      this.messages[goalId] = r.ok ? ((await r.json()) as MessageEntry[]) : []
    },
    async sendMessage(goalId: number, body: string) {
      await fetch(`/api/goals/${goalId}/messages`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ body }),
      })
      await this.listMessages(goalId)
    },
  },
})
