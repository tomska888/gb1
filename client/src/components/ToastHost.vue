<template>
  <div class="toast-host position-fixed top-0 end-0 p-3" style="z-index: 1060">
    <div
      v-for="t in store.items"
      :key="t.id"
      class="toast show mb-2"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div
        class="toast-body text-white"
        :class="{
          'bg-success': t.kind === 'success',
          'bg-danger': t.kind === 'error',
          'bg-primary': t.kind === 'info',
        }"
      >
        {{ t.text }}
        <button type="button" class="btn-close btn-close-white ms-2 float-end" @click="store.remove(t.id)"></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '../stores/toast.store'
const store = useToastStore()
</script>

<style scoped>
.toast { min-width: 260px; }
</style>
