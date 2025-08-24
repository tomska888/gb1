import { defineStore } from 'pinia';

export type CheckinStatus = 'on_track' | 'blocked' | 'done';

export interface SharedGoal {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  target_date: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  created_at: string;
  category: string | null;
  tags: string | null;
  color: string | null;
  owner_id?: number; // present when returned by /goals/shared
  permissions?: 'view' | 'checkin';
}

export interface Checkin {
  id: number;
  goal_id: number;
  user_id: number;
  status: CheckinStatus;
  progress: number | null;
  note: string | null;
  created_at: string;
}

export interface Message {
  id: number;
  body: string;
  created_at: string;
  sender_id: number;
  email: string;
}

export interface ShareRow {
  id: number;
  buddy_id: number;
  email: string;
  permissions: 'view' | 'checkin';
  created_at: string;
}

export interface OwnerRow {
  owner_id: number;
  email: string;
  goal_count: number;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export const useCollabStore = defineStore('collab', {
  state: () => ({
    // shared goals
    shared: [] as SharedGoal[],
    sharedPage: 1,
    sharedPages: 1,
    sharedTotal: 0,

    // per-goal data
    checkins: {} as Record<number, Checkin[]>,
    messages: {} as Record<number, Message[]>,
    shares: {} as Record<number, ShareRow[]>,

    // owners who share with me
    owners: [] as OwnerRow[],
    ownersLoaded: false,
    pageSize: 10,
  }),

  actions: {
    /* ---------- list owners (who share with me) ---------- */
    async listOwners() {
      const r = await fetch('/api/collab/owners', { headers: authHeaders() });
      if (!r.ok) throw new Error('Failed to load owners');
      this.owners = await r.json();
      this.ownersLoaded = true;
    },

    /* ---------- list shared goals ---------- */
    async listShared(opts?: {
      page?: number;
      pageSize?: number;
      q?: string;
      sort?: string;
      category?: string;
      status?: string;
      ownerId?: number; // NEW
    }) {
      const qs = new URLSearchParams();
      qs.set('page', String(opts?.page ?? this.sharedPage));
      qs.set('pageSize', String(opts?.pageSize ?? this.pageSize));
      if (opts?.q) qs.set('q', opts.q);
      if (opts?.sort) qs.set('sort', opts.sort);
      if (opts?.category) qs.set('category', opts.category);
      if (opts?.status) qs.set('status', opts.status!);
      if (opts?.ownerId) qs.set('ownerId', String(opts.ownerId));

      const r = await fetch(`/api/collab/goals/shared?${qs.toString()}`, { headers: authHeaders() });
      if (!r.ok) throw new Error('Failed to load shared goals');
      const data = await r.json();
      this.shared = data.data;
      this.sharedPage = data.page;
      this.sharedPages = data.totalPages;
      this.sharedTotal = data.total;
    },

    /* ---------- shares for a goal ---------- */
    async getShares(goalId: number) {
      const r = await fetch(`/api/collab/goals/${goalId}/shares`, { headers: authHeaders() });
      if (!r.ok) throw new Error('Failed to get shares');
      this.shares[goalId] = await r.json();
    },
    async share(goalId: number, email: string, permissions: 'view' | 'checkin' = 'checkin') {
      const r = await fetch(`/api/collab/goals/${goalId}/share`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email, permissions }),
      });
      if (!r.ok) throw new Error('Share failed');
      await this.getShares(goalId);
    },
    async revokeShare(goalId: number, buddyId: number) {
      const r = await fetch(`/api/collab/goals/${goalId}/share/${buddyId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!r.ok) throw new Error('Revoke failed');
      await this.getShares(goalId);
    },

    /* ---------- check-ins ---------- */
    async listCheckins(goalId: number) {
      if (!goalId && goalId !== 0) return;
      const r = await fetch(`/api/collab/goals/${goalId}/checkins`, { headers: authHeaders() });
      if (!r.ok) throw new Error('Failed to load check-ins');
      this.checkins[goalId] = await r.json();
    },
    async addCheckin(goalId: number, payload: { status: CheckinStatus; progress?: number | null; note?: string }) {
      const r = await fetch(`/api/collab/goals/${goalId}/checkins`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('Check-in failed');
      await this.listCheckins(goalId);
    },

    /* ---------- messages ---------- */
    async listMessages(goalId: number) {
      const r = await fetch(`/api/collab/goals/${goalId}/messages`, { headers: authHeaders() });
      if (!r.ok) throw new Error('Failed to load messages');
      this.messages[goalId] = await r.json();
    },
    async addMessage(goalId: number, body: string) {
      const r = await fetch(`/api/collab/goals/${goalId}/messages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ body }),
      });
      if (!r.ok) throw new Error('Message failed');
      await this.listMessages(goalId);
    },
  },
});
