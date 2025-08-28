<template>
  <div class="container">
    <h1 class="mb-3">Your Profile</h1>

    <!-- Account -->
    <div class="card mb-4">
      <div class="card-header">Account</div>
      <div class="card-body">
        <p class="mb-1"><strong>Email:</strong> {{ userEmail || '—' }}</p>
        <p class="mb-0 text-muted">
          <small>Member since: {{ memberSinceText }}</small>
        </p>
      </div>
    </div>

    <!-- People who share goals with me -->
    <div class="card mb-4">
      <div class="card-header d-flex align-items-center justify-content-between">
        <span>People who share goals with me</span>
        <button class="btn btn-sm btn-outline-secondary" @click="reloadOwners" :disabled="ownersLoading">
          {{ ownersLoading ? 'Loading…' : 'Refresh' }}
        </button>
      </div>
      <div class="card-body">
        <div v-if="ownersLoading" class="text-muted">Loading…</div>
        <div v-else-if="!owners.length" class="text-muted">No one has shared their goals with you yet.</div>
        <ul v-else class="list-group">
          <li
            v-for="o in owners"
            :key="o.owner_id"
            class="list-group-item d-flex align-items-center justify-content-between"
          >
            <div>
              <div class="fw-semibold">{{ o.email }}</div>
              <small class="text-muted">{{ o.goal_count }} shared goal{{ o.goal_count === 1 ? '' : 's' }}</small>
            </div>
            <button class="btn btn-sm btn-primary" @click="openOwner(o.owner_id)">
              View goals
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Preferences (client-side only) -->
    <div class="card">
      <div class="card-header">Preferences</div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Goals page size</label>
            <input
              type="number"
              min="5"
              max="50"
              step="5"
              class="form-control"
              v-model.number="pageSize"
              @change="applyPageSize"
            />
            <small class="text-muted">How many goals per page on Your Goals.</small>
          </div>

          <div class="col-md-4">
            <label class="form-label">Default status tab</label>
            <select class="form-select" v-model="defaultStatus" @change="applyDefaultStatus">
              <option value="in_progress">Active</option>
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
            <small class="text-muted">Which tab opens first on Your Goals.</small>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 text-muted">
      <small>These preferences are saved in your browser and can be changed anytime.</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useCollabStore } from '../stores/collab.store'
import { useGoalStore } from '../stores/goal.store'

const router = useRouter()
const auth = useAuthStore()
const collab = useCollabStore()
const goals = useGoalStore()

/* --- account --- */
const userEmail = computed(() => auth.userEmail)
const memberSinceText = computed(() => {
  const iso = auth.userCreatedAt
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
})

/* --- owners (people who share with me) --- */
const owners = computed(() => collab.owners ?? [])
const ownersLoading = ref(false)

async function reloadOwners() {
  ownersLoading.value = true
  try { await collab.listOwners() } finally { ownersLoading.value = false }
}

function openOwner(ownerId: number) {
  router.push({ name: 'Shared', query: { ownerId: String(ownerId) } })
}

/* --- preferences (client-side only) --- */
const pageSize = ref<number>(Number(localStorage.getItem('gb_pageSize') || goals.pageSize || 10))
const defaultStatus = ref<string>(localStorage.getItem('gb_status') || 'in_progress')

function applyPageSize() {
  const v = Math.min(50, Math.max(5, Number(pageSize.value || 10)))
  pageSize.value = v
  localStorage.setItem('gb_pageSize', String(v))
  goals.pageSize = v
}

function applyDefaultStatus() {
  localStorage.setItem('gb_status', defaultStatus.value)
}

onMounted(async () => {
  // If user refreshed and only token was persisted, fetch profile to populate created_at/email:
  if (!auth.userCreatedAt && auth.token) await auth.refreshMe()
  if (!collab.ownersLoaded) await reloadOwners()
  goals.pageSize = pageSize.value
})
</script>
