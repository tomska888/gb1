<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <footer class="bg-light text-center py-3 mt-auto">
    <div class="container">
      <small>&copy; {{ new Date().getFullYear() }} GoalBuddy. All rights reserved.</small>
    </div>
  </footer>
</template>

<script setup lang="ts">
// no logic needed for now
</script>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({})
</script>

<style scoped>
/* Scoped footer styles if needed */
</style>
