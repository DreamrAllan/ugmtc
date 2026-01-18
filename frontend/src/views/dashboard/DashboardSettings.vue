<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'

const authStore = useAuthStore()
const user = computed(() => authStore.currentUser)

const showPasswordChange = ref(false)
const passwordForm = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})
const message = ref({ type: '', text: '' })

const handlePasswordChange = () => {
    message.value = { type: '', text: '' }
    
    if (passwordForm.value.newPassword.length < 6) {
        message.value = { type: 'error', text: 'Password baru minimal 6 karakter' }
        return
    }
    
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
        message.value = { type: 'error', text: 'Password baru tidak cocok' }
        return
    }
    
    // In real app, verify current password with backend
    message.value = { type: 'success', text: 'Password berhasil diubah' }
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    showPasswordChange.value = false
}
</script>

<template>
    <div class="dashboard-settings">
        <div class="page-header">
            <h1>Pengaturan</h1>
            <p class="page-subtitle">Kelola akun dan preferensi Anda</p>
        </div>

        <!-- Account Info -->
        <div class="settings-section card">
            <h3>Informasi Akun</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Email</span>
                    <span class="info-value">{{ user?.email }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Nama Pelatih</span>
                    <span class="info-value">{{ user?.coachName }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Nama Tim</span>
                    <span class="info-value">{{ user?.teamName }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">No. HP</span>
                    <span class="info-value">{{ user?.phone }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Terdaftar Pada</span>
                    <span class="info-value">{{ new Date(user?.createdAt).toLocaleDateString('id-ID') }}</span>
                </div>
            </div>
        </div>

        <!-- Password Change -->
        <div class="settings-section card">
            <div class="section-header">
                <h3>Ubah Password</h3>
                <button 
                    class="btn btn-secondary" 
                    @click="showPasswordChange = !showPasswordChange"
                >
                    {{ showPasswordChange ? 'Batal' : 'Ubah Password' }}
                </button>
            </div>
            
            <div v-if="showPasswordChange" class="password-form">
                <div v-if="message.text" class="message" :class="message.type">
                    {{ message.text }}
                </div>
                
                <div class="form-group">
                    <label class="form-label">Password Saat Ini</label>
                    <input 
                        v-model="passwordForm.currentPassword" 
                        type="password" 
                        class="form-input"
                        placeholder="Masukkan password saat ini"
                    >
                </div>
                <div class="form-group">
                    <label class="form-label">Password Baru</label>
                    <input 
                        v-model="passwordForm.newPassword" 
                        type="password" 
                        class="form-input"
                        placeholder="Minimal 6 karakter"
                    >
                </div>
                <div class="form-group">
                    <label class="form-label">Konfirmasi Password Baru</label>
                    <input 
                        v-model="passwordForm.confirmPassword" 
                        type="password" 
                        class="form-input"
                        placeholder="Masukkan password baru lagi"
                    >
                </div>
                <button class="btn btn-primary" @click="handlePasswordChange">
                    Simpan Password
                </button>
            </div>
        </div>

        <!-- Contact Support -->
        <div class="settings-section card">
            <h3>Butuh Bantuan?</h3>
            <p class="support-text">Hubungi panitia UGMTC 2026 untuk pertanyaan atau masalah:</p>
            <div class="contact-info">
                <p>📧 ugmtc2026@gmail.com</p>
                <p>📱 +62 812-3456-7890</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard-settings {
    max-width: 800px;
    margin: 0 auto;
}

.page-header {
    margin-bottom: var(--space-8);
}

.page-header h1 {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-2);
}

.page-subtitle {
    color: var(--text-muted);
}

.settings-section {
    padding: var(--space-6);
    margin-bottom: var(--space-6);
}

.settings-section h3 {
    margin-bottom: var(--space-4);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
}

.section-header h3 {
    margin-bottom: 0;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-4);
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
}

.info-label {
    font-size: var(--text-sm);
    color: var(--text-muted);
}

.info-value {
    font-weight: 500;
}

.password-form {
    padding-top: var(--space-4);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.message {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-4);
    font-size: var(--text-sm);
}

.message.success {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid var(--success);
    color: var(--success);
}

.message.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--error);
    color: var(--error);
}

.support-text {
    color: var(--text-muted);
    margin-bottom: var(--space-4);
}

.contact-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.contact-info p {
    font-size: var(--text-lg);
}
</style>
