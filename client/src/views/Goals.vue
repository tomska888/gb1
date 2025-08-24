<template>
  <div>
    <ToastHost />

    <h2>Your Goals</h2>

    <!-- TABS -->
    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <ul class="nav nav-pills flex-wrap">
        <li class="nav-item">
          <button class="nav-link" :class="{ active: status === 'all' }" @click="setStatus('all')">
            All <span class="badge bg-secondary ms-1">{{ total }}</span>
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: status === 'in_progress' }" @click="setStatus('in_progress')">
            Active
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: status === 'completed' }" @click="setStatus('completed')">
            Completed
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: status === 'abandoned' }" @click="setStatus('abandoned')">
            Abandoned
          </button>
        </li>
      </ul>

      <div class="ms-auto d-flex align-items-center gap-2">
        <button class="btn btn-outline-dark" @click="toggleFilters" title="Show/Hide search & sort">
          <span v-if="showFilters">Hide Filters</span>
          <span v-else>Show Filters</span>
        </button>
      </div>
    </div>

    <!-- COLLAPSIBLE: SEARCH + SORT + CATEGORY FILTER -->
    <div v-if="showFilters" class="row g-2 align-items-end mb-3">
      <div class="col-md-5">
        <label class="form-label">Search</label>
        <input
          v-model="search"
          type="search"
          class="form-control"
          placeholder="Search title, description, or tags…"
        />
      </div>

      <div class="col-md-4">
        <label class="form-label">Category</label>
        <input
          v-model="categoryFilter"
          list="gb-categories"
          class="form-control"
          placeholder="All categories"
        />
        <datalist id="gb-categories">
          <option v-for="c in goalStore.categories" :key="c" :value="c" />
        </datalist>
      </div>

      <div class="col-md-2">
        <label class="form-label">Sort by</label>
        <select v-model="sortKey" class="form-select">
          <option value="created_desc">Created (newest)</option>
          <option value="created_asc">Created (oldest)</option>
          <option value="target_asc">Target date (soonest)</option>
          <option value="target_desc">Target date (latest)</option>
          <option value="title_asc">Title (A–Z)</option>
          <option value="title_desc">Title (Z–A)</option>
        </select>
      </div>

      <div class="col-md-1 d-grid">
        <button class="btn btn-outline-secondary" @click="resetFilters">Reset</button>
      </div>
    </div>

    <!-- CREATE / EDIT FORM -->
    <form @submit.prevent="onSubmit" class="mb-4">
      <div class="row g-2 align-items-end">
        <div class="col-md-3">
          <label class="form-label">Title</label>
          <input ref="titleInput" v-model="title" placeholder="New goal title" type="text" class="form-control" required />
        </div>

        <div class="col-md-3">
          <label class="form-label">Description</label>
          <input v-model="description" placeholder="Optional description" type="text" class="form-control" />
        </div>

        <div class="col-md-2">
          <label class="form-label">Target date</label>
          <input v-model="targetDate" type="date" class="form-control" />
        </div>

        <div class="col-md-2">
          <label class="form-label">Category</label>
          <input v-model="category" list="gb-categories" class="form-control" placeholder="e.g. Health" />
        </div>

        <div class="col-md-1">
          <label class="form-label">Color</label>
          <input v-model="color" type="color" class="form-control form-control-color" />
        </div>

        <div class="col-md-1 d-grid">
          <button type="submit" class="btn btn-primary">{{ editingId ? 'Save' : 'Add Goal' }}</button>
        </div>
      </div>

      <div class="row g-2 mt-2">
        <div class="col-md-6">
          <label class="form-label">Tags (comma-separated)</label>
          <input v-model="tags" class="form-control" placeholder="work, cardio, reading" />
        </div>
        <div v-if="editingId" class="col-md-2 d-grid">
          <button type="button" class="btn btn-secondary" @click="cancelEdit">Cancel edit</button>
        </div>
      </div>
    </form>

    <!-- LIST -->
    <ul class="list-group">
      <li v-for="goal in goalStore.goals" :key="goal.id" class="list-group-item">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="d-flex align-items-center gap-2">
              <span v-if="goal.color" class="d-inline-block rounded-circle" :style="{ background: goal.color, width: '10px', height: '10px' }"></span>
              <h5 class="mb-1" :class="{ 'text-decoration-line-through': goal.status === 'completed' }">{{ goal.title }}</h5>
              <span v-if="isOverdue(goal)" class="badge bg-danger">Overdue</span>
              <span v-else-if="isDueSoon(goal)" class="badge bg-warning text-dark">Due soon</span>
              <span v-if="goal.category" class="badge bg-secondary">{{ goal.category }}</span>
              <span v-for="t in splitTags(goal.tags)" :key="t" class="badge bg-light text-dark border">{{ t }}</span>
            </div>

            <p v-if="goal.description" class="mb-1">{{ goal.description }}</p>
            <div class="text-muted">
              <small>Target: {{ goal.targetDate ? goal.targetDate.slice(0,10) : '—' }}</small>
              <small class="ms-2">Created at {{ formatDate(goal.createdAt) }}</small>
            </div>

            <div class="mt-1">
              <small class="text-muted">Status:</small>
              <select
                class="form-select form-select-sm d-inline-block w-auto ms-1"
                :value="goal.status"
                @change="onStatusChange($event, goal)"
              >
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="abandoned">Abandoned</option>
              </select>

              <button
                v-if="goal.status !== 'completed'"
                class="btn btn-sm btn-success ms-2"
                @click="markCompleted(goal)"
              >
                Complete
              </button>
              <button
                v-else
                class="btn btn-sm btn-outline-secondary ms-2"
                @click="reopen(goal)"
              >
                Reopen
              </button>
            </div>
          </div>

          <div class="ms-2 d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary" @click="startEdit(goal)">Edit</button>
            <button class="btn btn-sm btn-outline-danger" @click="remove(goal.id)">Delete</button>
          </div>
        </div>
      </li>
    </ul>

    <!-- PAGINATION -->
    <div class="d-flex justify-content-between align-items-center mt-3">
      <div class="text-muted small">
        Page {{ goalStore.page }} / {{ goalStore.totalPages }} ·
        Showing {{ showingFrom }}–{{ showingTo }} of {{ total }}
      </div>
      <div class="btn-group">
        <button class="btn btn-outline-secondary" :disabled="goalStore.page <= 1" @click="prevPage">Prev</button>
        <button class="btn btn-outline-secondary" :disabled="goalStore.page >= goalStore.totalPages" @click="nextPage">Next</button>
      </div>
    </div>

    <div v-if="!goalStore.goals.length && !goalStore.loading" class="text-center text-muted mt-5">
      No goals in this list.
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'GoalsView' })

import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useToastStore } from '../stores/toast.store'
import { useGoalStore, type Goal, type Status, type SortKey } from '../stores/goal.store'

const toast = useToastStore()
const goalStore = useGoalStore()

// refs for focusing
const titleInput = ref<HTMLInputElement | null>(null)

// form
const title = ref('')
const description = ref('')
const targetDate = ref<string | null>(null)
const category = ref<string>('')
const tags = ref<string>('')
const color = ref<string>('#3b82f6') // nice blue default
const editingId = ref<number | null>(null)

// filters (server-side)
type StatusTab = 'all' | 'in_progress' | 'completed' | 'abandoned'
const status = ref<StatusTab>((localStorage.getItem('gb_status') as StatusTab) || 'in_progress')
const sortKey = ref<SortKey>((localStorage.getItem('gb_sort') as SortKey) || 'created_desc')
const showFilters = ref<boolean>(localStorage.getItem('gb_showFilters') === '1')
const search = ref<string>(localStorage.getItem('gb_search') || '')
const categoryFilter = ref<string>(localStorage.getItem('gb_cat') || '')

// debounced search
const debouncedSearch = ref<string>(search.value)
let searchTimer: number | undefined
watch(search, (val) => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => (debouncedSearch.value = val), 250)
})

// persist UI state
watch([status, sortKey, search, showFilters, categoryFilter], () => {
  localStorage.setItem('gb_status', status.value)
  localStorage.setItem('gb_sort', sortKey.value)
  localStorage.setItem('gb_search', search.value)
  localStorage.setItem('gb_showFilters', showFilters.value ? '1' : '0')
  localStorage.setItem('gb_cat', categoryFilter.value)
})

// derived
const total = computed(() => goalStore.total)
const showingFrom = computed(() => (goalStore.total === 0 ? 0 : (goalStore.page - 1) * goalStore.pageSize + 1))
const showingTo = computed(() => Math.min(goalStore.page * goalStore.pageSize, goalStore.total))

function toggleFilters() { showFilters.value = !showFilters.value }
function setStatus(s: StatusTab) { status.value = s; goalStore.page = 1; fetchList() }
function resetFilters() {
  search.value = ''
  categoryFilter.value = ''
  sortKey.value = 'created_desc'
  status.value = 'in_progress'
  goalStore.page = 1
  fetchList()
}

function splitTags(t: string | null) {
  return (t ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

function todayMidnight() {
  const d = new Date()
  d.setHours(0,0,0,0)
  return d.getTime()
}
function isOverdue(g: Goal) {
  if (!g.targetDate || g.status === 'completed') return false
  return new Date(g.targetDate).getTime() < todayMidnight()
}
function isDueSoon(g: Goal) {
  if (!g.targetDate || g.status === 'completed') return false
  const t = new Date(g.targetDate).getTime()
  const today = todayMidnight()
  const inThree = today + 3*24*60*60*1000
  return t >= today && t <= inThree
}

async function fetchList() {
  await goalStore.loadGoals({
    page: goalStore.page,
    pageSize: goalStore.pageSize,
    status: status.value,
    q: debouncedSearch.value,
    sort: sortKey.value,
    category: categoryFilter.value || undefined,
  })
}

function nextPage() {
  if (goalStore.page < goalStore.totalPages) {
    goalStore.page += 1
    fetchList()
  }
}
function prevPage() {
  if (goalStore.page > 1) {
    goalStore.page -= 1
    fetchList()
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeyDown)
  await goalStore.loadCategories()
  await fetchList()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})

// actions
async function onSubmit() {
  try {
    if (editingId.value) {
      await goalStore.updateGoal(editingId.value, {
        title: title.value,
        description: description.value || null,
        targetDate: targetDate.value ?? null,
        category: category.value || null,
        tags: tags.value || null,
        color: color.value || null,
      })
      toast.success('Goal updated')
      resetForm()
      await fetchList()
      return
    }

    await goalStore.addGoal({
      title: title.value,
      description: description.value || undefined,
      targetDate: targetDate.value ?? null,
      category: category.value || undefined,
      tags: tags.value || undefined,
      color: color.value || undefined,
    })
    toast.success('Goal added')
    resetForm()
    // refresh first page (newest first by default)
    goalStore.page = 1
    await fetchList()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Action failed')
  }
}

function startEdit(goal: Goal) {
  editingId.value = goal.id
  title.value = goal.title
  description.value = goal.description ?? ''
  targetDate.value = goal.targetDate ? goal.targetDate.slice(0, 10) : null
  category.value = goal.category ?? ''
  tags.value = goal.tags ?? ''
  color.value = goal.color ?? '#3b82f6'
  nextTick(() => titleInput.value?.focus())
}
function cancelEdit() { resetForm() }

async function remove(id: number) {
  if (!confirm('Delete this goal?')) return
  try {
    await goalStore.deleteGoal(id)
    toast.info('Goal deleted')
    await fetchList()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Delete failed')
  }
}

async function onStatusChange(e: Event, goal: Goal) {
  const value = (e.target as HTMLSelectElement).value as Status
  if (value === goal.status) return
  try {
    await goalStore.updateGoal(goal.id, { status: value })
    toast.success('Status updated')
  } catch {
    toast.error('Failed to update status')
  }
}

async function markCompleted(goal: Goal) {
  try {
    await goalStore.updateGoal(goal.id, { status: 'completed' })
    toast.success('Marked completed')
  } catch { toast.error('Failed to update') }
}
async function reopen(goal: Goal) {
  try {
    await goalStore.updateGoal(goal.id, { status: 'in_progress' })
    toast.success('Reopened')
  } catch { toast.error('Failed to update') }
}

function resetForm() {
  editingId.value = null
  title.value = ''
  description.value = ''
  targetDate.value = null
  category.value = ''
  tags.value = ''
  color.value = '#3b82f6'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString()
}

// keyboard shortcuts (ignore when typing in inputs/textarea/select)
function onKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName
  const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
  if (!typing) {
    if (e.key === '1') setStatus('all')
    if (e.key === '2') setStatus('in_progress')
    if (e.key === '3') setStatus('completed')
    if (e.key === '4') setStatus('abandoned')

    if (e.key === '/') {
      e.preventDefault()
      showFilters.value = true
      nextTick(() => document.querySelector<HTMLInputElement>('input[type="search"]')?.focus())
    }
    if (e.key.toLowerCase() === 'n') {
      nextTick(() => titleInput.value?.focus())
    }
  }
}
</script>

<style scoped>
.text-decoration-line-through { text-decoration: line-through; }
.nav .nav-link { cursor: pointer; }
</style>
