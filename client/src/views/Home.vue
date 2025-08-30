<template>
  <div class="container my-4">
    <!-- Hero -->
    <div class="p-4 p-md-5 mb-4 bg-light rounded-3">
      <div class="container-fluid py-2">
        <h1 class="display-6 fw-semibold">Welcome back 👋</h1>
        <p class="col-md-8 fs-6 text-muted mb-0">
          Track your goals, share with a buddy, and keep momentum with quick check-ins.
        </p>
      </div>
    </div>

    <!-- 3-up preview: Active / Shared / This Week -->
    <div class="row g-3">
      <!-- My Active Goals -->
      <div class="col-lg-4">
        <div class="card h-100 d-flex flex-column">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>My active goals</span>
            <router-link class="btn btn-sm btn-outline-primary" :to="{ name: 'Goals' }">View all</router-link>
          </div>

          <ul class="list-group list-group-flush flex-grow-1">
            <li v-if="goalStore.loading" class="list-group-item text-muted">Loading…</li>
            <li v-for="g in activePreview" :key="g.id" class="list-group-item">
              <div class="d-flex align-items-start justify-content-between">
                <div class="me-2">
                  <div class="d-flex align-items-center gap-2">
                    <span v-if="g.color" class="d-inline-block rounded-circle"
                          :style="{ background: g.color, width: '10px', height: '10px' }" />
                    <strong>{{ g.title }}</strong>
                    <span v-if="g.category" class="badge bg-secondary">{{ g.category }}</span>
                  </div>
                  <small class="text-muted d-block">
                    Target: {{ g.targetDate ? g.targetDate.slice(0,10) : '—' }}
                  </small>
                </div>
              </div>
            </li>
            <li v-if="!activePreview.length && !goalStore.loading" class="list-group-item text-muted">
              No active goals yet.
            </li>
          </ul>

          <div class="card-footer d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary" @click="refreshAll">Refresh</button>
            <button class="btn btn-sm btn-outline-dark ms-auto" @click="exportActiveCsv">Export CSV</button>
          </div>
        </div>
      </div>

      <!-- Shared with me -->
      <div class="col-lg-4">
        <div class="card h-100 d-flex flex-column">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>Shared with me</span>
            <router-link class="btn btn-sm btn-outline-primary" :to="{ name: 'Profile' }">Open</router-link>
          </div>

          <ul class="list-group list-group-flush flex-grow-1">
            <li v-if="collabLoading" class="list-group-item text-muted">Loading…</li>
            <li v-for="g in sharedPreview" :key="g.id" class="list-group-item">
              <div class="d-flex align-items-start justify-content-between">
                <div class="me-2">
                  <strong>{{ g.title }}</strong>
                  <div class="small text-muted">
                    Target: {{ g.target_date ? g.target_date.slice(0,10) : '—' }}
                    <span v-if="g.status === 'completed'" class="badge bg-success ms-2">Completed</span>
                  </div>
                </div>
              </div>
            </li>
            <li v-if="!sharedPreview.length && !collabLoading" class="list-group-item text-muted">
              Nothing shared with you yet.
            </li>
          </ul>

          <div class="card-footer">
            <button class="btn btn-sm btn-outline-secondary" @click="refreshAll">Refresh</button>
          </div>
        </div>
      </div>

      <!-- This Week -->
      <div class="col-lg-4">
        <div class="card h-100 d-flex flex-column">
          <div class="card-header">This week</div>

          <ul class="list-group list-group-flush flex-grow-1">
            <li v-for="g in thisWeek" :key="g.id" class="list-group-item">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <strong>{{ g.title }}</strong>
                  <div class="small text-muted">
                    Due {{ g.targetDate ? g.targetDate.slice(0,10) : '—' }}
                  </div>
                </div>
                <span class="badge bg-warning text-dark" v-if="isDueSoon(g)">Due soon</span>
              </div>
            </li>
            <li v-if="!thisWeek.length" class="list-group-item text-muted">
              No goals due this week.
            </li>
          </ul>

          <div class="card-footer">
            <button class="btn btn-sm btn-outline-secondary" @click="refreshAll">Refresh</button>
          </div>
        </div>
      </div>
    </div>

    <br>
    <!-- Quick add a goal -->
    <!-- <div class="card my-4">
      <div class="card-header">Quick add a goal</div>
      <form @submit.prevent="quickAdd" class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-md-3">
            <label class="form-label">Title</label>
            <input v-model="qTitle" class="form-control" placeholder="e.g. Run 5k" required />
          </div>
          <div class="col-md-3">
            <label class="form-label">Description</label>
            <input v-model="qDesc" class="form-control" placeholder="Optional description" />
          </div>
          <div class="col-md-2">
            <label class="form-label">Target date</label>
            <input v-model="qTarget" type="date" class="form-control" />
          </div>
          <div class="col-md-2">
            <label class="form-label">Category</label>
            <input v-model="qCategory" class="form-control" placeholder="e.g. Health" />
          </div>
          <div class="col-md-1">
            <label class="form-label">Color</label>
            <input v-model="qColor" type="color" class="form-control form-control-color" />
          </div>
          <div class="col-md-1 d-grid">
            <button class="btn btn-primary" type="submit">Add</button>
          </div>
        </div>
        <div class="row g-2 mt-2">
          <div class="col-md-6">
            <label class="form-label">Tags (comma-separated)</label>
            <input v-model="qTags" class="form-control" placeholder="work, cardio, reading" />
          </div>
        </div>
      </form>
    </div> -->

    <!-- Tips & shortcuts -->
    <div class="card">
      <div class="card-header">Tips & shortcuts</div>
      <div class="card-body">
        <ul class="mb-0">
          <li>Press <kbd>/</kbd> to focus search in Goals, <kbd>n</kbd> to focus “Title”.</li>
          <li>Use <kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd>/<kbd>4</kbd> to jump All/Active/Completed/Abandoned.</li>
          <li>Share a goal with a buddy to unlock quick check-ins and messaging.</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGoalStore, type Goal } from '../stores/goal.store'
import { useCollabStore, type SharedGoal } from '../stores/collab.store'

// Stores
const goalStore = useGoalStore()
const collab = useCollabStore()

// Local previews (computed from stores so fields are mapped correctly)
const activePreview = computed<Goal[]>(() => goalStore.goals.slice(0, 5))
const sharedPreview = computed<SharedGoal[]>(() => collab.shared.slice(0, 5))

// Quick add form
// const qTitle = ref('')
// const qDesc = ref('')
// const qTarget = ref<string | null>(null)
// const qCategory = ref('')
// const qTags = ref('')
// const qColor = ref('#3b82f6')

// Collab loading flag (lightweight)
const collabLoading = ref(false)

function todayMidnight() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
function inDaysMidnight(days: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d.getTime()
}

const thisWeek = computed(() =>
  activePreview.value
    .filter(g => g.targetDate && g.status === 'in_progress')
    .filter(g => {
      const t = new Date(g.targetDate as string).getTime()
      return t >= todayMidnight() && t <= inDaysMidnight(7)
    })
    .slice(0, 5)
)

function isDueSoon(g: Goal) {
  if (!g.targetDate) return false
  const t = new Date(g.targetDate).getTime()
  return t >= todayMidnight() && t <= inDaysMidnight(3)
}

// async function quickAdd() {
//   await goalStore.addGoal({
//     title: qTitle.value,
//     description: qDesc.value || undefined,
//     targetDate: qTarget.value ?? null,
//     category: qCategory.value || undefined,
//     tags: qTags.value || undefined,
//     color: qColor.value || undefined
//   })
//   // reset
//   qTitle.value = ''
//   qDesc.value = ''
//   qTarget.value = null
//   qCategory.value = ''
//   qTags.value = ''
//   qColor.value = '#3b82f6'
//   // refresh previews
//   await refreshAll()
// }

async function refreshAll() {
  await Promise.all([
    goalStore.loadGoals({ page: 1, pageSize: 50, status: 'in_progress', sort: 'created_desc' }),
    (async () => { collabLoading.value = true; try { await collab.listShared({ page: 1, pageSize: 5 }) } finally { collabLoading.value = false } })()
  ])
}

/** CSV exporter (quotes, escapes, and mitigates CSV injection) */
function exportActiveCsv() {
  const rows = [
    ['id','title','status','target_date','category','tags','created_at'],
    ...activePreview.value.map(g => [
      g.id, g.title, g.status, g.targetDate ?? '', g.category ?? '', g.tags ?? '', g.createdAt
    ])
  ]
  const csv = rows.map(r => r.map(csvEscapeSafe).join(',')).join('\n')
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
function csvEscapeSafe(value: unknown): string {
  // Basic escape + mitigate Excel CSV injection (prefix dangerous leading chars with a single quote)
  let s = String(value ?? '')
  if (/^[=+\-@]/.test(s)) s = `'` + s
  return `"${s.replace(/"/g, '""')}"`
}

onMounted(refreshAll)
</script>
