<template>
  <div id="shareModal" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Share goal</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
        </div>

        <div class="modal-body">
          <div
            v-if="errorMsg"
            class="alert alert-danger d-flex justify-content-between align-items-center py-2"
          >
            <span>{{ errorMsg }}</span>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              @click="errorMsg = ''"
            ></button>
          </div>
          <div
            v-if="successMsg"
            class="alert alert-success d-flex justify-content-between align-items-center py-2"
          >
            <span>{{ successMsg }}</span>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              @click="successMsg = ''"
            ></button>
          </div>

          <div v-if="singleMode" class="alert alert-info py-2">
            This goal is already shared with one buddy. Revoke the current share first to share with
            someone else.
          </div>

          <div class="input-group mb-3">
            <input
              v-model="email"
              type="email"
              class="form-control"
              placeholder="buddy@email.com"
              :disabled="singleMode"
              @input="clearBanner"
            />
            <select
              v-model="perm"
              class="form-select"
              style="max-width: 140px"
              :disabled="singleMode"
            >
              <option value="checkin">Check-in</option>
              <option value="view">View only</option>
            </select>
            <button class="btn btn-primary" :disabled="!email || singleMode" @click="doShare">
              Share
            </button>
          </div>

          <div v-if="shares.length">
            <div class="fw-semibold mb-2">Shared with</div>
            <ul class="list-group">
              <li
                v-for="s in shares"
                :key="s.id"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>
                  {{ s.email }} <small class="text-muted">({{ s.permissions }})</small>
                </span>
                <button class="btn btn-sm btn-outline-danger" @click="revoke(s.buddy_id)">
                  Revoke
                </button>
              </li>
            </ul>
          </div>
          <div v-else class="text-muted">Not shared yet.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue'
import { useCollabStore } from '../stores/collab.store'

export default defineComponent({
  name: 'ShareDialog',
  props: { goalId: { type: Number, required: false, default: undefined } },
  setup(props) {
    const collab = useCollabStore()
    const email = ref('')
    const perm = ref<'view' | 'checkin'>('checkin')
    const shares = computed(() => (props.goalId != null ? (collab.shares[props.goalId] ?? []) : []))
    const singleMode = computed(() => shares.value.length >= 1)

    const errorMsg = ref('')
    const successMsg = ref('')

    function clearBanner() {
      errorMsg.value = ''
      successMsg.value = ''
    }

    watch(
      () => props.goalId,
      async (id) => {
        clearBanner()
        if (typeof id === 'number') await collab.getShares(id)
      },
      { immediate: true },
    )

    async function doShare() {
      if (props.goalId == null) return
      clearBanner()
      try {
        const { emailSent } = await collab.share(props.goalId, email.value, perm.value)
        successMsg.value = emailSent
          ? `Shared with ${email.value}. Email notification sent.`
          : `Shared with ${email.value}.`
        email.value = ''
      } catch (e: unknown) {
        errorMsg.value = e instanceof Error ? e.message : 'Share failed.'
      }
    }

    async function revoke(buddyId: number) {
      if (props.goalId == null) return
      clearBanner()
      await collab.revokeShare(props.goalId, buddyId)
      successMsg.value = 'Share revoked.'
    }

    return { email, perm, shares, singleMode, doShare, revoke, errorMsg, successMsg, clearBanner }
  },
})
</script>
