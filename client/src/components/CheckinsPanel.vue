<template>
  <div class="mt-2">
    <div class="d-flex gap-2 align-items-end">
      <select
        v-model="status"
        class="form-select form-select-sm"
        style="max-width: 160px"
        :disabled="readonly"
      >
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
        :disabled="readonly"
      />

      <input
        v-model="note"
        class="form-control form-control-sm"
        placeholder="Quick check-in note"
        :disabled="readonly"
      />

      <button class="btn btn-sm btn-outline-primary" @click="send" :disabled="readonly">
        Send
      </button>
      <button class="btn btn-sm btn-outline-secondary" @click="reload">
        Refresh
      </button>
    </div>

    <ul class="list-group list-group-flush mt-2">
      <li v-for="c in list" :key="c.id" class="list-group-item px-0">
        <!-- who posted -->
        <span
          v-if="c.user_id === myUserId"
          class="badge bg-primary me-2"
          title="From you"
        >me</span>
        <span
          v-else
          class="badge bg-info text-dark me-2"
          title="From buddy"
        >buddy</span>

        <!-- status / progress -->
        <span class="badge bg-light text-dark border me-2">{{ c.status }}</span>
        <span v-if="c.progress != null" class="badge bg-info text-dark me-2">{{ c.progress }}%</span>

        <!-- text + time -->
        <span>{{ c.note }}</span>
        <small class="text-muted ms-2">{{ new Date(c.created_at).toLocaleString() }}</small>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, ref } from 'vue'
import { useCollabStore, type CheckinStatus } from '../stores/collab.store'

function decodeUserIdFromJwt(token: string | null): number | undefined {
  if (!token) return undefined
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.userId === 'number' ? payload.userId : undefined
  } catch {
    return undefined
  }
}

export default defineComponent({
  name: 'CheckinsPanel',
  props: {
    goalId:   { type: Number, required: true },
    readonly: { type: Boolean, required: false, default: false }, // lock inputs (used when goal is completed)
  },
  setup(props) {
    const collab = useCollabStore()
    const status = ref<CheckinStatus>('on_track')
    const progress = ref<number | null>(null)
    const note = ref('')

    const list = computed(() => collab.checkins[props.goalId] ?? [])

    async function reload() {
      await collab.listCheckins(props.goalId)
    }

    async function send() {
      await collab.addCheckin(props.goalId, {
        status: status.value,
        progress: progress.value,
        note: note.value,
      })
      note.value = ''
      progress.value = null
      status.value = 'on_track'
    }

    onMounted(reload)

    const myUserId = decodeUserIdFromJwt(localStorage.getItem('token'))

    return { status, progress, note, list, send, reload, myUserId, readonly: props.readonly }
  }
})
</script>
