<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="row justify-content-center">
    <div class="col-md-6">
      <h2>Sign Up</h2>

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
          <input v-model="password" type="password" class="form-control" minlength="8" required />
        </div>
        <button :disabled="loading" type="submit" class="btn btn-success">
          <span v-if="loading" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          <span v-if="!loading">Sign Up</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

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
    await auth.signup({ email: email.value, password: password.value })
  } catch (err: unknown) {
    // Narrow error safely (no 'any')
    if (axios.isAxiosError<{ message?: string }>(err)) {
      error.value = err.response?.data?.message ?? 'Signup failed. Please try again.'
    } else if (err instanceof Error) {
      error.value = err.message || 'Signup failed. Please try again.'
    } else {
      error.value = 'Signup failed. Please try again.'
    }
  } finally {
    loading.value = false
    if (auth.token) {
      error.value = null
      router.push({ name: 'Goals' })
    }
  }
}
</script>
