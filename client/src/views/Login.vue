<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="row justify-content-center">
    <div class="col-md-6">
      <h2>Login</h2>

      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <form @submit.prevent="onSubmit">
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input v-model="email" type="email" class="form-control" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input v-model="password" type="password" class="form-control" required />
        </div>
        <button :disabled="loading" type="submit" class="btn btn-primary">
          <span v-if="loading" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          <span v-if="!loading">Login</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { isAxiosError } from 'axios'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function onSubmit() {
  error.value = null
  loading.value = true

  try {
    await auth.login({ email: email.value, password: password.value })
  } catch (err: unknown) {
    console.error('Login threw:', err)
    if (isAxiosError(err)) {
      error.value = err.response?.data?.message || 'Login failed. Please check your credentials.'
    } else {
      error.value =
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.'
    }
  } finally {
    loading.value = false
    // **If** login actually set a token, go on to Goals
    if (auth.token) {
      error.value = null
      router.push({ name: 'Goals' })
    }
  }
}
</script>
