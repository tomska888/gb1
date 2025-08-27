<template>
  <div class="container py-4">

    <!-- Hero + counters -->
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
      <div>
        <h1 class="mb-1">Welcome to GoalBuddy</h1>
        <p class="text-muted mb-0">Set goals. Share with a buddy. Keep moving.</p>
      </div>

      <div class="d-flex gap-2 flex-wrap">
        <span class="badge bg-secondary">All {{ counters.all }}</span>
        <span class="badge bg-primary">Active {{ counters.in_progress }}</span>
        <span class="badge bg-success">Completed {{ counters.completed }}</span>
        <span class="badge bg-dark">Abandoned {{ counters.abandoned }}</span>
      </div>
    </div>

    <!-- Quick Add -->
    <section class="card mb-4">
      <div class="card-body">
        <h2 class="h5 mb-3">Quick add a goal</h2>
        <form @submit.prevent="onQuickAdd">
          <div class="row g-2 align-items-end">
            <div class="col-md-4">
              <label class="form-label">Title</label>
              <input v-model="qa.title" type="text" class="form-control" placeholder="New goal title" required />
            </div>
            <div class="col-md-3">
              <label class="form-label">Target date</label>
              <input v-model="qa.targetDate" type="date" class="form-control" />
            </div>
            <div class="col-md-3">
              <label class="form-label">Category</label>
              <input v-model="qa.category" list="gb-categories" class="form-control" placeholder="e.g. Health" />
              <datalist id="gb-categories">
                <option v-for="c in goalStore.categories" :key="c" :value="c" />
              </datalist>
            </div>
            <div class="col-md-1">
              <label class="form-label">Color</label>
              <input v-model="qa.color" type="color" class="form-control form-control-color" />
            </div>
            <div class="col-md-1 d-grid">
              <button class="btn btn-primary">Add</button>
            </div>
          </div>
          <div class="row g-2 mt-2">
            <div class="col-md-6">
              <label class="form-label">Tags (comma-separated)</label>
              <input v-model="qa.tags" class="form-control" placeholder="work, cardio, reading" />
            </div>
          </div>
        </form>
      </div>
    </section>

    <div class="row g-3">

      <!-- My active goals -->
      <section class="col-lg-6">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h2 class="h5 mb-0">My active goals</h2>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-secondary" @click="exportActiveCsv" :disabled="!activeGoals.length">Export CSV</button>
                <router-link to="/goals" class="btn btn-sm btn-outline-primary">See all</router-link>
              </div>
            </div>

            <div v-if="!activeGoals.length" class="text-muted">No active goals yet.</div>

            <ul class="list-group">
              <li v-for="g in activeGoals" :key="g.id" class="list-group-item">
                <div class="d-flex justify-content-between">
                  <div>
                    <div class="d-flex align-items-center gap-2">
                      <span v-if="g.color" class="d-inline-block rounded-circle" :style="{ background: g.color, width: '10px', height: '10px' }"></span>
                      <strong>{{ g.title }}</strong>
                      <span v-if="isOverdue(g)" class="badge bg-danger">Overdue</span>
                      <span v-else-if="isDueSoon(g)" class="badge bg-warning text-dark">Due soon</span>
                      <span v-if="g.category" class="badge bg-secondary">{{ g.category }}</span>
                    </div>
                    <small class="text-muted">
                      Target: {{ g.targetDate ? g.targetDate.slice(0,10) : '—' }} ·
                      Created: {{ fmt(g.createdAt) }}
                    </small>
                  </div>
                  <router-link :to="{ name:'Goals' }" class="btn btn-sm btn-outline-secondary">Open</router-link>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Shared with me (latest) -->
      <section class="col-lg-6">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h2 class="h5 mb-0">Shared with me</h2>
              <router-link to="/shared" class="btn btn-sm btn-outline-primary">Open shared</router-link>
            </div>

            <div v-if="!sharedLatest.length" class="text-muted">No shared goals yet.</div>

            <ul class="list-group">
              <li v-for="g in sharedLatest" :key="g.id" class="list-group-item">
                <div class="d-flex justify-content-between">
                  <div>
                    <strong>{{ g.title }}</strong>
                    <span v-if="g.status==='completed'" class="badge bg-success ms-2">Completed</span>
                    <div class="small text-muted">
                      Target: {{ g.target_date ? g.target_date.slice(0,10) : '—' }}
                    </div>
                  </div>
                  <router-link to="/shared" class="btn btn-sm btn-outline-secondary">Open</router-link>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Week outlook -->
      <section class="col-12">
        <div class="card">
          <div class="card-body">
            <h2 class="h5">This week</h2>
            <div v-if="!weekOutlook.length" class="text-muted">No targets in the next 7 days.</div>
            <div class="table-responsive" v-else>
              <table class="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Goal</th>
                    <th>Category</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="g in weekOutlook" :key="g.id">
                    <td>{{ g.targetDate?.slice(0,10) }}</td>
                    <td>{{ g.title }}</td>
                    <td>{{ g.category || '—' }}</td>
                    <td><span class="badge bg-primary">Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <!-- Shortcuts -->
      <section class="col-12">
        <div class="card">
          <div class="card-body">
            <h2 class="h5">Tips & shortcuts</h2>
            <ul class="mb-0">
              <li><kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd>/<kbd>4</kbd> switch status tabs on Goals</li>
              <li><kbd>/</kbd> shows & focuses search on Goals</li>
              <li><kbd>n</kbd> focuses “New goal title”</li>
              <li>Install as app (PWA): Browser menu → <em>Install</em></li>
            </ul>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useGoalStore, type Goal } from '../stores/goal.store'
import { useCollabStore } from '../stores/collab.store'
import { useToastStore } from '../stores/toast.store'

const goalStore = useGoalStore()
const collab = useCollabStore()
const toast = useToastStore()

/* ---------- counters (reuse pattern from Goals.vue) ---------- */
const counters = ref({ all: 0, in_progress: 0, completed: 0, abandoned: 0 })
function headers(): HeadersInit {
  const h: Record<string,string> = { 'Content-Type': 'application/json' }
  const t = localStorage.getItem('token'); if (t) h.Authorization = `Bearer ${t}`
  return h
}
async function loadCounters() {
  const r = await fetch('/api/goals/counters', { headers: headers() })
  if (r.ok) counters.value = await r.json()
}

/* ---------- quick add form ---------- */
const qa = ref({
  title: '',
  targetDate: null as string | null,
  category: '',
  tags: '',
  color: '#3b82f6',
})
async function onQuickAdd() {
  try {
    await goalStore.addGoal({
      title: qa.value.title,
      targetDate: qa.value.targetDate ?? null,
      category: qa.value.category || undefined,
      tags: qa.value.tags || undefined,
      color: qa.value.color || undefined,
    })
    toast.success('Goal added')
    qa.value = { title: '', targetDate: null, category: '', tags: '', color: '#3b82f6' }
    await Promise.all([refreshActive(), loadCounters()])
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Failed to add goal')
  }
}

/* ---------- lists ---------- */
async function refreshActive() {
  // small page pull of active goals sorted by closest target
  await goalStore.loadGoals({
    page: 1,
    pageSize: 12,
    status: 'in_progress',
    sort: 'target_asc',
  })
}

async function refreshShared() {
  await collab.listShared({ page: 1, pageSize: 6, sort: 'created_desc' })
}

const activeGoals = computed<Goal[]>(() => goalStore.goals)
const sharedLatest = computed(() => collab.shared)

/* ---------- week outlook (next 7 days from active goals we loaded) ---------- */
const weekOutlook = computed<Goal[]>(() => {
  const now = new Date()
  const in7 = new Date(now.getTime() + 7 * 86400000)
  return activeGoals.value
    .filter(g => g.targetDate && new Date(g.targetDate) >= startOfDay(now) && new Date(g.targetDate) <= in7)
    .sort((a, b) => (a.targetDate ?? '').localeCompare(b.targetDate ?? ''))
})

/* ---------- helpers ---------- */
function fmt(s: string) { return new Date(s).toLocaleString() }
function startOfDay(d: Date){ const x=new Date(d); x.setHours(0,0,0,0); return x }
function todayMidnight(){ const d=new Date(); d.setHours(0,0,0,0); return d.getTime() }
function isOverdue(g: Goal){ if(!g.targetDate || g.status==='completed') return false; return new Date(g.targetDate).getTime() < todayMidnight() }
function isDueSoon(g: Goal){
  if(!g.targetDate || g.status==='completed') return false
  const t=new Date(g.targetDate).getTime(), today=todayMidnight(), inThree=today+3*86400000
  return t>=today && t<=inThree
}

/* ---------- CSV export (active goals currently shown) ---------- */
function exportActiveCsv() {
  const rows = [
    ['id','title','status','target_date','category','tags','created_at'],
    ...activeGoals.value.map(g => [
      g.id, g.title, g.status, g.targetDate ?? '', g.category ?? '', g.tags ?? '', g.createdAt
    ])
  ]

  const csv = rows
    .map(r => r.map(csvEscape).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `goalbuddy-active-${new Date().toISOString().slice(0,10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function csvEscape(value: unknown): string {
  // Escape quotes by doubling them; wrap the field in quotes.
  const s = String(value ?? '')
  return `"${s.replace(/"/g, '""')}"`
}


/* ---------- mount ---------- */
onMounted(async () => {
  await goalStore.loadCategories()
  await Promise.all([refreshActive(), refreshShared(), loadCounters()])
})
</script>
