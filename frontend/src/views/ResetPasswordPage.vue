<template>
  <div class="reset-password-page">
    <div class="reset-container">
      <div class="reset-card">
        <h1>Reset Password</h1>

        <!-- Success State -->
        <div v-if="isSuccess" class="success-message">
          <div class="success-icon">✓</div>
          <h3>Password Berhasil Direset!</h3>
          <p>Password Anda telah berhasil diubah. Silakan login dengan password baru.</p>
          <router-link to="/login" class="btn-primary">
            Login Sekarang
          </router-link>
        </div>

        <!-- Invalid Token -->
        <div v-else-if="!token" class="error-state">
          <div class="error-icon">!</div>
          <h3>Link Tidak Valid</h3>
          <p>Link reset password tidak valid. Silakan request link baru.</p>
          <router-link to="/forgot-password" class="btn-secondary">
            Request Link Baru
          </router-link>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleSubmit" class="reset-form">
          <p class="subtitle">Masukkan password baru Anda.</p>

          <div class="form-group">
            <label for="password">Password Baru</label>
            <input
              type="password"
              id="password"
              v-model="password"
              placeholder="Minimal 6 karakter"
              required
              minlength="6"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Konfirmasi Password</label>
            <input
              type="password"
              id="confirmPassword"
              v-model="confirmPassword"
              placeholder="Ulangi password baru"
              required
              :disabled="isLoading"
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn-submit" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-small"></span>
            {{ isLoading ? 'Menyimpan...' : 'Reset Password' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const route = useRoute()
const authStore = useAuthStore()

const token = ref(null)
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const isSuccess = ref(false)
const error = ref(null)

onMounted(() => {
  token.value = route.query.token
})

const handleSubmit = async () => {
  error.value = null

  if (password.value.length < 6) {
    error.value = 'Password minimal 6 karakter'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Password tidak cocok'
    return
  }

  isLoading.value = true

  try {
    await authStore.resetPassword(token.value, password.value)
    isSuccess.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.reset-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 20px;
}

.reset-container {
  width: 100%;
  max-width: 440px;
}

.reset-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

h1 {
  color: #1e293b;
  font-size: 1.75rem;
  margin-bottom: 24px;
  text-align: center;
}

.subtitle {
  color: #64748b;
  margin-bottom: 24px;
  text-align: center;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.form-group input {
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.btn-submit {
  padding: 14px 24px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner-small {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  padding: 12px 16px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 8px;
  font-size: 0.9rem;
}

.success-message,
.error-state {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin: 0 auto 16px;
}

.error-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  margin: 0 auto 16px;
}

.success-message h3 {
  color: #059669;
  margin-bottom: 12px;
}

.error-state h3 {
  color: #1e293b;
  margin-bottom: 12px;
}

.success-message p,
.error-state p {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 24px;
}

.btn-primary {
  display: inline-block;
  padding: 14px 32px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);
}

.btn-secondary {
  display: inline-block;
  padding: 14px 32px;
  background: #f1f5f9;
  color: #1e293b;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #e2e8f0;
}
</style>
