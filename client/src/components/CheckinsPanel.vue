<template>
  <div class="mt-2">
    <!-- One compact row: status/% (hidden in compact/view-only), quick message, single Send, Refresh -->
    <div class="d-flex flex-wrap align-items-end gap-2 mb-2">
      <!-- Hide status/% for buddy compact OR when view-only -->
      <template v-if="!compact && canPost">
        <select v-model="status" class="form-select form-select-sm" style="max-width:160px">
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

      <!-- Single bigger input that doubles as the chat message and/or check-in note -->
      <input
        v-model="message"
        class="form-control form-control-sm flex-grow-1"
        placeholder="Quick check-in note or message…"
        :disabled="!canPost"
        @keyup.enter="sendCombined"
      />

      <button class="btn btn-sm btn-outline-primary" :disabled="!canPost" @click="sendCombined">
        Send
      </button>
      <button class="btn btn-sm btn-outline-secondary" @click="reloadAll">Refresh</button>
    </div>

    <!-- Combined stream (newest first). We include ALL check-ins and either last N or all messages. -->
    <ul class="list-group list-group-flush">
      <li v-for="item in combinedVisible" :key="item._key" class="list-group-item px-0">
        <!-- Chat messages -->
        <template v-if="item._type === 'message'">
          <span class="badge me-2" :class="isMe(item) ? 'bg-primary' : 'bg-secondary'">
            {{ isMe(item) ? 'Me' : 'Buddy' }}
          </span>
          <span>{{ item.body }}</span>
          <small class="text-muted ms-2">{{ format(item.created_at) }}</small>
        </template>

        <!-- Check-ins -->
        <template v-else>
          <span class="badge bg-light text-dark border me-2">{{ item.status }}</span>
          <span v-if="item.progress != null" class="badge bg-info text-dark me-2">{{ item.progress }}%</span>
          <span>{{ item.note }}</span>
          <small class="text-muted ms-2">{{ format(item.created_at) }}</small>
        </template>
      </li>
    </ul>

    <!-- Collapser for long message lists (check-ins are always shown) -->
    <div v-if="messages.length > maxMessages" class="mt-2">
      <button class="btn btn-link p-0" @click="showAllMessages = !showAllMessages">
        {{ showAllMessages ? 'Show fewer messages' : `Show all messages (${messages.length})` }}
      </button>
    </div>
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
    /** compact=true for buddy side – hides status/% */
    compact: { type: Boolean, default: false },
    /** from /collab/goals/shared: 'view' blocks posting, 'checkin' allows */
    permissions: { type: String as () => 'view' | 'checkin' | undefined, default: undefined },
  },
  setup(props) {
    const collab = useCollabStore()
    const auth = useAuthStore()

    // Inputs
    const status = ref<CheckinStatus>('on_track')
    const progress = ref<number | null>(null)
    const message = ref('')

    // Data
    const checkins = computed(() => collab.checkins[props.goalId] ?? [])
    const messages = computed(() => collab.messages[props.goalId] ?? [])

    // Posting allowed?
    const canPost = computed(() => {
      // Owners (Goals page) don't pass permissions -> allowed
      if (!props.permissions) return true
      return props.permissions === 'checkin'
    })

    // Me/Buddy check by email (preferred)
    const myEmail = computed(() => (auth.userEmail || '').toLowerCase())
    function isMe(m: { email?: string }) {
      return Boolean(m.email) && m.email!.toLowerCase() === myEmail.value
    }

    // Collapser for messages
    const maxMessages = 5
    const showAllMessages = ref(false)
    const visibleMessages = computed(() =>
      showAllMessages.value ? messages.value : messages.value.slice(0, maxMessages)
    )

    // Merge: all check-ins + visible messages, newest firstt
    const combinedVisible = computed(() => {
      const a = checkins.value.map((c: any) => ({ ...c, _type: 'checkin', _key: `c-${c.id}` }))
      const b = visibleMessages.value.map((m: any) => ({ ...m, _type: 'message', _key: `m-${m.id}` }))
      return [...a, ...b].sort(
        (x: any, y: any) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime()
      )
    })

    function format(s: string) { return new Date(s).toLocaleString() }

    async function reloadAll() {
      await Promise.all([
        collab.listCheckins(props.goalId),
        collab.listMessages(props.goalId),
      ])
    }

    // Single send: create a check-in (with status/% and optional note) AND post a chat message (if any)
    async function sendCombined() {
      if (!canPost.value) return

      // 1) check-in
      await collab.addCheckin(props.goalId, {
        status: status.value,
        progress: progress.value ?? null,
        // Save the same message text as the check-in note (or empty)
        note: message.value.trim() || undefined,
      })

      // 2) chat message (only if non-empty)
      if (message.value.trim()) {
        await collab.addMessage(props.goalId, message.value.trim())
      }

      // reset inputs
      progress.value = null
      message.value = ''
      status.value = 'on_track'

      // refresh streams
      await reloadAll()
    }

    onMounted(reloadAll)
    watch(() => props.goalId, reloadAll)

    return {
      // inputs
      status, progress, message,
      // lists
      messages, combinedVisible,
      // flags
      canPost, compact: props.compact,
      // collapser
      maxMessages, showAllMessages,
      // helpers
      isMe, format, reloadAll, sendCombined,
    }
  },
})
</script>
