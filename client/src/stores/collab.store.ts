import { defineStore } from 'pinia'

export type CheckinStatus = 'on_track' | 'blocked' | 'done'

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

export interface Checkin {
  id: number
  goal_id: number
  user_id: number
  status: CheckinStatus
  progress: number | null
  note: string | null
  created_at: string
}

export interface Message {
  id: number
  goal_id: number
  sender_id: number
  body: string
  created_at: string
  email?: string
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token')
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' }
}

function validId(id: unknown): id is number {
  return typeof id === 'number' && Number.isFinite(id) && id > 0
}

export const useCollabStore = defineStore('collab', {
  state: () => ({
    // shared goals list
    shared: [] as SharedGoal[],
    sharedPage: 1,
    sharedPages: 1,
    sharedTotal: 0,

    // per-goal data caches
    checkins: {} as Record<number, Checkin[]>,
    messages: {} as Record<number, Message[]>,

    // shares (per goal)
    shares: {} as Record<number, Array<{ id: number; buddy_id: number; email: string; permissions: string; created_at: string }>>,
  }),

  actions: {
    /* -------- shared goals ---------- */
    async listShared(params?: { page?: number; pageSize?: number; q?: string; sort?: string; category?: string; status?: string }) {
      const p = new URLSearchParams()
      if (params?.page) p.set('page', String(params.page))
      if (params?.pageSize) p.set('pageSize', String(params.pageSize))
      if (params?.q) p.set('q', params.q)
      if (params?.sort) p.set('sort', params.sort)
      if (params?.category) p.set('category', params.category)
      if (params?.status) p.set('status', params.status)

      const r = await fetch(`/api/collab/goals/shared?${p.toString()}`, { headers: authHeaders() })
      if (!r.ok) throw new Error('Failed to load shared goals')
      const json = await r.json()
      this.shared = json.data as SharedGoal[]
      this.sharedPage = json.page
      this.sharedPages = json.totalPages
      this.sharedTotal = json.total
    },

    /* -------- check-ins ------------ */
    async listCheckins(goalId: number) {
      if (!validId(goalId)) return
      const r = await fetch(`/api/collab/goals/${goalId}/checkins`, { headers: authHeaders() })
      if (!r.ok) throw new Error('Failed to load check-ins')
      const data = (await r.json()) as Checkin[]
      this.checkins[goalId] = data
    },

    async addCheckin(goalId: number, payload: { status: CheckinStatus; progress?: number | null; note?: string }) {
      if (!validId(goalId)) return
      const r = await fetch(`/api/collab/goals/${goalId}/checkins`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const t = await r.text()
        throw new Error(t || 'Failed to add check-in')
      }
      const row = (await r.json()) as Checkin
      const list = this.checkins[goalId] ?? []
      this.checkins[goalId] = [row, ...list]
    },

    /* -------- messages ------------- */
    async listMessages(goalId: number) {
      if (!validId(goalId)) return
      const r = await fetch(`/api/collab/goals/${goalId}/messages`, { headers: authHeaders() })
      if (!r.ok) throw new Error('Failed to load messages')
      const data = (await r.json()) as Message[]
      this.messages[goalId] = data
    },

    async addMessage(goalId: number, body: string) {
      if (!validId(goalId)) return
      const r = await fetch(`/api/collab/goals/${goalId}/messages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ body }),
      })
      if (!r.ok) throw new Error('Failed to add message')
      const row = (await r.json()) as Message
      const list = this.messages[goalId] ?? []
      this.messages[goalId] = [row, ...list]
    },

    /* -------- shares (owner side) -- */
    async getShares(goalId: number) {
      if (!validId(goalId)) return
      const r = await fetch(`/api/collab/goals/${goalId}/shares`, { headers: authHeaders() })
      if (!r.ok) throw new Error('Failed to load shares')
      this.shares[goalId] = await r.json()
    },

    async share(goalId: number, email: string, permissions: 'view' | 'checkin' = 'checkin') {
      if (!validId(goalId)) return
      const r = await fetch(`/api/collab/goals/${goalId}/share`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email, permissions }),
      })
      if (!r.ok) throw new Error('Share failed')
      await this.getShares(goalId)
    },

    async revokeShare(goalId: number, buddyId: number) {
      if (!validId(goalId) || !validId(buddyId)) return
      const r = await fetch(`/api/collab/goals/${goalId}/share/${buddyId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!r.ok) throw new Error('Revoke failed')
      await this.getShares(goalId)
      // also purge cached chat/checkins for a clean UX
      delete this.checkins[goalId]
      delete this.messages[goalId]
    },
  },
})
