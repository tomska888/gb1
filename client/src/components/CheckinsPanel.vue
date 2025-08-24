<template>
  <div class="mt-2">
    <!-- Composer (hidden for compact or view-only) -->
    <div
      v-if="!compact && canPost"
      class="d-flex gap-2 align-items-end mb-2"
    >
      <select v-model="status" class="form-select form-select-sm" style="max-width: 160px">
        <option value="on_track">On track</option>
        <option value="blocked">Blocked</option>
        <option value="done">Done</option>
      </select>
      <input v-model.number="progress" type="number" min="0" max="100" class="form-control form-control-sm" style="max-width:100px" placeholder="%"/>
      <input v-model="note" class="form-control form-control-sm" placeholder="Quick check-in note" />
      <button class="btn btn-sm btn-outline-primary" @click="sendCheckin">Send</button>
      <button class="btn btn-sm btn-outline-secondary" @click="reloadAll">Refresh</button>
    </div>

    <!-- Messages composer (always show for owners; for buddy only if canPost) -->
    <div class="input-group input-group-sm mb-2" v-if="canPost">
      <input
        v-model="message"
        type="text"
        class="form-control"
        placeholder="Write a quick message…"
        @keyup.enter="sendMessage"
      />
      <button class="btn btn-outline-primary" @click="sendMessage">Send</button>
    </div>

    <!-- Messages -->
    <ul class="list-group list-group-flush">
      <li
        v-for="m in msgs"
        :key="m.id"
        class="list-group-item px-0 d-flex align-items-start justify-content-between"
      >
        <div class="me-2">
          <span
            class="badge"
            :class="isMe(m) ? 'bg-primary' : 'bg-secondary'"
          >
            {{ isMe(m) ? 'Me' : 'Buddy' }}
          </span>
          <span class="ms-2">{{ m.body }}</span>
          <small class="text-muted ms-2">{{ new Date(m.created_at).toLocaleString() }}</small>
        </div>
      </li>
    </ul>

    <!-- Check-ins (read-only list; creation above if allowed) -->
    <ul class="list-group list-group-flush mt-2">
      <li v-for="c in list" :key="c.id" class="list-group-item px-0">
        <span class="badge bg-light text-dark border me-2">{{ c.status }}</span>
        <span v-if="c.progress != null" class="badge bg-info text-dark me-2">{{ c.progress }}%</span>
        <span>{{ c.note }}</span>
        <small class="text-muted ms-2">{{ new Date(c.created_at).toLocaleString() }}</small>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, ref, watch } from 'vue'
import { useCollabStore, type CheckinStatus } from '../stores/collab.store'
import { useAuthStore } from '../stores/auth.store'

export default defineComponent({
  name: 'CheckinsPanel',
  props: {
    goalId: { type: Number, required: true },
    /** compact=true is what you use on “Shared with me” to hide status/% inputs */
    compact: { type: Boolean, default: false },
    /** optional: permissions from /goals/shared (view | checkin) */
    permissions: { type: String as () => 'view' | 'checkin' | undefined, default: undefined },
  },
  setup(props) {
    const collab = useCollabStore()
    const auth = useAuthStore()

    // form state
    const status = ref<CheckinStatus>('on_track')
    const progress = ref<number | null>(null)
    const note = ref('')
    const message = ref('')

    // derive lists
    const list = computed(() => collab.checkins[props.goalId] ?? [])
    const msgs = computed(() => collab.messages[props.goalId] ?? [])

    // who can post? owners always can; buddies only if permissions=checkin
    const canPost = computed(() => {
      // If permissions is supplied from shared list, respect it.
      if (props.permissions) return props.permissions === 'checkin'
      // If not supplied (owner’s own Goals view), allow posting.
      return true
    })

    // label logic: compare message email with current user email
    function isMe(m: { email: string }) {
      return m.email && auth.userEmail && m.email.toLowerCase() === auth.userEmail.toLowerCase()
    }

    async function reloadAll() {
      await Promise.all([collab.listCheckins(props.goalId), collab.listMessages(props.goalId)])
    }

    async function sendCheckin() {
      if (!canPost.value) return
      await collab.addCheckin(props.goalId, {
        status: status.value,
        progress: progress.value,
        note: note.value,
      })
      note.value = ''
      progress.value = null
      status.value = 'on_track'
      await collab.listCheckins(props.goalId)
    }

    async function sendMessage() {
      if (!canPost.value) return
      if (!message.value.trim()) return
      await collab.addMessage(props.goalId, message.value.trim())
      message.value = ''
      await collab.listMessages(props.goalId)
    }

    onMounted(reloadAll)
    watch(() => props.goalId, reloadAll)

    return { status, progress, note, message, list, msgs, canPost, isMe, sendCheckin, sendMessage, reloadAll }
  }
})
</script>
