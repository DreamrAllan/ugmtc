<template>
  <div class="forgot-password-page">
    <div class="forgot-container">
      <div class="forgot-card">
        <router-link to="/login" class="back-link">
          ← Kembali ke Login
        </router-link>

        <h1>Lupa Password</h1>
        <p class="subtitle">Masukkan email Anda dan kami akan mengirimkan link untuk reset password.</p>

        <!-- Success Message -->
        <div v-if="isSuccess" class="success-message">
          <div class="success-icon">✓</div>
          <h3>Email Terkirim!</h3>
          <p>Jika email terdaftar, Anda akan menerima link untuk reset password. Silakan cek inbox dan folder spam Anda.</p>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleSubmit" class="forgot-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              v-model="email"
              placeholder="Masukkan email Anda"
              required
              :disabled="isLoading"
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn-submit" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-small"></span>
            {{ isLoading ? 'Mengirim...' : 'Kirim Link Reset' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()

const email = ref('')
const isLoading = ref(false)
const isSuccess = ref(false)
const error = ref(null)

const handleSubmit = async () => {
  if (!email.value) return

  isLoading.value = true
  error.value = null

  try {
    await authStore.forgotPassword(email.value)
    isSuccess.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.forgot-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 20px;
}

.forgot-container {
  width: 100%;
  max-width: 440px;
}

.forgot-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.back-link {
  display: inline-block;
  color: #64748b;
  text-decoration: none;
  font-size: 0.9rem;
  margin-bottom: 24px;
  transition: color 0.2s;
}

.back-link:hover {
  color: #2563eb;
}

h1 {
  color: #1e293b;
  font-size: 1.75rem;
  margin-bottom: 8px;
}

.subtitle {
  color: #64748b;
  margin-bottom: 32px;
  line-height: 1.6;
}

.forgot-form {
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

.success-message {
  text-align: center;
  padding: 20px;
}

.success-message .success-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin: 0 auto 16px;
}

.success-message h3 {
  color: #059669;
  margin-bottom: 12px;
}

.success-message p {
  color: #64748b;
  line-height: 1.6;
}
</style>
