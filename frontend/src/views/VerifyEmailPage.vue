<template>
  <div class="verify-email-page">
    <div class="verify-container">
      <div class="verify-card">
        <!-- Loading State -->
        <div v-if="isLoading" class="verify-loading">
          <div class="spinner"></div>
          <h2>Memverifikasi Email...</h2>
          <p>Mohon tunggu sebentar</p>
        </div>

        <!-- Success State -->
        <div v-else-if="isSuccess" class="verify-success">
          <div class="success-icon">✓</div>
          <h2>Email Berhasil Diverifikasi!</h2>
          <p>Terima kasih telah memverifikasi email Anda. Akun Anda sekarang sudah aktif.</p>
          <router-link to="/login" class="btn-primary">
            Login Sekarang
          </router-link>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="verify-error">
          <div class="error-icon">✗</div>
          <h2>Verifikasi Gagal</h2>
          <p>{{ error }}</p>
          <div class="error-actions">
            <router-link to="/login" class="btn-secondary">
              Ke Halaman Login
            </router-link>
          </div>
        </div>

        <!-- No Token -->
        <div v-else class="verify-no-token">
          <div class="warning-icon">!</div>
          <h2>Token Tidak Ditemukan</h2>
          <p>Link verifikasi tidak valid. Silakan cek email Anda kembali.</p>
          <router-link to="/" class="btn-primary">
            Kembali ke Beranda
          </router-link>
        </div>
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

const isLoading = ref(false)
const isSuccess = ref(false)
const error = ref(null)

onMounted(async () => {
  const token = route.query.token

  if (!token) {
    return
  }

  isLoading.value = true

  try {
    await authStore.verifyEmail(token)
    isSuccess.value = true
  } catch (e) {
    error.value = e.message || 'Terjadi kesalahan saat verifikasi'
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.verify-email-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 20px;
}

.verify-container {
  width: 100%;
  max-width: 440px;
}

.verify-card {
  background: white;
  border-radius: 16px;
  padding: 48px 40px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.verify-loading h2,
.verify-success h2,
.verify-error h2,
.verify-no-token h2 {
  margin: 20px 0 12px;
  color: #1e293b;
  font-size: 1.5rem;
}

.verify-loading p,
.verify-success p,
.verify-error p,
.verify-no-token p {
  color: #64748b;
  margin-bottom: 24px;
  line-height: 1.6;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
  margin: 0 auto;
}

.error-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin: 0 auto;
}

.warning-icon {
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
  margin: 0 auto;
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
