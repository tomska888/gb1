<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCollabStore, type SharedGoal } from '../stores/collab.store'
import CheckinsPanel from '../components/CheckinsPanel.vue'
const collab = useCollabStore()
const route = useRoute()

const ownerId = computed(() => {
  const raw = route.query.owner
  const n = typeof raw === 'string' ? Number(raw) : Array.isArray(raw) ? Number(raw[0]) : NaN
  return Number.isFinite(n) ? n : undefined
})
function canPost(g: SharedGoal) {
  return g.permissions === 'checkin' && g.status !== 'completed'
}
function load(page?: number) { collab.listShared({ page, ownerId: ownerId.value }) }
function next(){ load(collab.sharedPage + 1) }
function prev(){ load(collab.sharedPage - 1) }
onMounted(async () => { if (!collab.ownersLoaded) await collab.listOwners(); load() })
watch(ownerId, () => load(1))
</script>

<template>
  <div>
    <h2>Shared with me</h2>

    <ul class="list-group">
      <li v-for="g in collab.shared" :key="g.id" class="list-group-item">
        <div class="d-flex justify-content-between">
          <div class="w-100">
            <div class="d-flex align-items-center gap-2">
              <h5 class="mb-1">{{ g.title }}</h5>
              <span v-if="g.permissions==='view'" class="badge bg-secondary">View only</span>
              <span v-if="g.status==='completed'" class="badge bg-success">Completed</span>
            </div>
            <small class="text-muted d-block mb-2">
              Owner goal · Target: {{ g.target_date ? g.target_date.slice(0,10) : '—' }}
            </small>

            <!-- compact panel; canPost controls the quick input row -->
            <CheckinsPanel :goalId="g.id" :compact="true" :canPost="canPost(g)" />
          </div>
        </div>
      </li>
    </ul>

    <div class="d-flex justify-content-between align-items-center mt-3">
      <div class="text-muted small">Page {{ collab.sharedPage }} / {{ collab.sharedPages }} · {{ collab.sharedTotal }} total</div>
      <div class="btn-group">
        <button class="btn btn-outline-secondary" :disabled="collab.sharedPage<=1" @click="prev">Prev</button>
        <button class="btn btn-outline-secondary" :disabled="collab.sharedPage>=collab.sharedPages" @click="next">Next</button>
      </div>
    </div>
  </div>
</template>
