<template>
  <div class="mt-2">
    <!-- Composer -->
    <div class="d-flex gap-2 align-items-end">
      <!-- Only show status/% when NOT compact (owner view). Buddy view uses note-only quick check-in -->
      <template v-if="!compact">
        <select v-model="status" class="form-select form-select-sm" style="max-width: 160px">
          <option value="on_track">On track</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </select>

        <input
          v-model.number="progress"
          type="number"
          min="0"
          max="100"
          class="form-control form-control-sm"
          style="max-width:100px"
          placeholder="%"
        />
      </template>

      <input
        v-model="note"
        class="form-control form-control-sm"
        placeholder="Quick check-in note"
      />
      <button class="btn btn-sm btn-outline-primary" @click="send">Send</button>
      <button class="btn btn-sm btn-outline-secondary" @click="reload">Refresh</button>
    </div>

    <!-- Timeline -->
    <ul class="list-group list-group-flush mt-2">
      <li v-for="c in list" :key="c.id" class="list-group-item px-0 d-flex justify-content-between align-items-start">
        <div class="me-2">
          <span class="badge bg-light text-dark border me-2">{{ c.status }}</span>
          <span v-if="c.progress != null" class="badge bg-info text-dark me-2">{{ c.progress }}%</span>
          <span>{{ c.note }}</span>
          <small class="text-muted ms-2">{{ formatDate(c.created_at) }}</small>
        </div>

        <!-- Who wrote it: Me / Buddy -->
        <span
          class="badge rounded-pill"
          :class="isMine(c) ? 'bg-primary' : 'bg-secondary'"
        >
          {{ isMine(c) ? 'Me' : 'Buddy' }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, ref } from 'vue'
import { useCollabStore, type CheckinStatus } from '../stores/collab.store'

type CheckinRow = {
  id: number
  goal_id: number
  user_id: number
  status: 'on_track' | 'blocked' | 'done'
  progress: number | null
  note: string | null
  created_at: string
}

function readMyUserId(): number | null {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''))
    const id = payload?.userId
    return typeof id === 'number' ? id : null
  } catch {
    return null
  }
}

export default defineComponent({
  name: 'CheckinsPanel',
  props: {
    goalId: { type: Number, required: true },
    /** When true (buddy view), hide status/% inputs – keep note-only quick check-in */
    compact: { type: Boolean, default: false },
  },
  setup(props) {
    const collab = useCollabStore()

    // composer state
    const status   = ref<CheckinStatus>('on_track')
    const progress = ref<number | null>(null)
    const note     = ref('')

    // current user id from JWT
    const myId = ref<number | null>(readMyUserId())

    const list = computed<CheckinRow[]>(() => (collab.checkins[props.goalId] ?? []) as CheckinRow[])

    function formatDate(s: string) {
      return new Date(s).toLocaleString()
    }

    function isMine(c: CheckinRow) {
      return c.user_id === myId.value
    }

    async function reload() {
      await collab.listCheckins(props.goalId)
    }

    async function send() {
      // In compact mode (buddy side) we send only note (status defaults to on_track, progress null)
      const body = props.compact
        ? { status: 'on_track' as CheckinStatus, progress: null as number | null, note: note.value }
        : { status: status.value, progress: progress.value, note: note.value }

      await collab.addCheckin(props.goalId, body)
      // reset composer
      note.value = ''
      if (!props.compact) {
        progress.value = null
        status.value = 'on_track'
      }
      // refresh list
      await reload()
    }

    onMounted(reload)

    return { status, progress, note, list, send, reload, isMine, formatDate }
  }
})
</script>
