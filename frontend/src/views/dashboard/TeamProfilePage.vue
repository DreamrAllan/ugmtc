<script setup>
import { ref, onMounted, computed } from 'vue'
import { teamApi, getImageUrl } from '../../services/api'

// State
const loading = ref(true)
const saving = ref(false)
const uploadingLogo = ref(false)
const error = ref('')
const success = ref('')

const profile = ref(null)
const athleteCount = ref(0)
const maxCoaches = ref(2)

// Coach form
const showCoachForm = ref(false)
const coachForm = ref({
    name: '',
    phone: '',
    role: 'assistant'
})
const savingCoach = ref(false)

// Computed
const logoPreview = computed(() => {
    if (profile.value?.logoUrl) {
        return getImageUrl(profile.value.logoUrl)
    }
    return null
})

const canAddCoach = computed(() => {
    return (profile.value?.coaches?.length || 0) < maxCoaches.value
})

const isProfileComplete = computed(() => {
    return profile.value?.logoUrl && (profile.value?.coaches?.length || 0) >= 1
})

// Load profile
const loadProfile = async () => {
    try {
        loading.value = true
        error.value = ''
        const data = await teamApi.getProfile()
        profile.value = data
        athleteCount.value = data.athleteCount || 0
        maxCoaches.value = data.maxCoaches || 2
    } catch (err) {
        error.value = err.message
    } finally {
        loading.value = false
    }
}

// Upload logo
const handleLogoUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
        error.value = 'Please select an image file'
        return
    }

    if (file.size > 5 * 1024 * 1024) {
        error.value = 'Image size must be less than 5MB'
        return
    }

    try {
        uploadingLogo.value = true
        error.value = ''
        const result = await teamApi.uploadLogo(file)
        profile.value = result.profile
        success.value = 'Logo uploaded successfully!'
        setTimeout(() => success.value = '', 3000)
    } catch (err) {
        error.value = err.message
    } finally {
        uploadingLogo.value = false
    }
}

// Add coach
const addCoach = async () => {
    if (!coachForm.value.name.trim()) {
        error.value = 'Coach name is required'
        return
    }

    try {
        savingCoach.value = true
        error.value = ''
        await teamApi.addCoach(coachForm.value)
        await loadProfile()
        showCoachForm.value = false
        coachForm.value = { name: '', phone: '', role: 'assistant' }
        success.value = 'Coach added successfully!'
        setTimeout(() => success.value = '', 3000)
    } catch (err) {
        error.value = err.message
    } finally {
        savingCoach.value = false
    }
}

// Remove coach
const removeCoach = async (coachId) => {
    if (!confirm('Are you sure you want to remove this coach?')) return

    try {
        error.value = ''
        await teamApi.removeCoach(coachId)
        await loadProfile()
        success.value = 'Coach removed successfully!'
        setTimeout(() => success.value = '', 3000)
    } catch (err) {
        error.value = err.message
    }
}

// Edit coach
const editingCoachId = ref(null)
const editCoachForm = ref({ name: '', phone: '', role: 'assistant' })

const startEditCoach = (coach) => {
    editingCoachId.value = coach.id
    editCoachForm.value = {
        name: coach.name,
        phone: coach.phone || '',
        role: coach.role || 'assistant'
    }
}

const cancelEditCoach = () => {
    editingCoachId.value = null
    editCoachForm.value = { name: '', phone: '', role: 'assistant' }
}

const saveEditCoach = async () => {
    if (!editCoachForm.value.name.trim()) {
        error.value = 'Coach name is required'
        return
    }

    try {
        saving.value = true
        error.value = ''
        await teamApi.updateCoach(editingCoachId.value, editCoachForm.value)
        await loadProfile()
        editingCoachId.value = null
        editCoachForm.value = { name: '', phone: '', role: 'assistant' }
        success.value = 'Coach updated successfully!'
        setTimeout(() => success.value = '', 3000)
    } catch (err) {
        error.value = err.message
    } finally {
        saving.value = false
    }
}

onMounted(loadProfile)
</script>

<template>
    <div class="team-profile-page">
        <div class="page-header">
            <h1>Profil Tim</h1>
            <p class="subtitle">Lengkapi profil tim Anda sebelum mendaftarkan atlet</p>
        </div>

        <!-- Status Banner -->
        <div v-if="!loading" :class="['status-banner', isProfileComplete ? 'complete' : 'incomplete']">
            <div class="status-icon">
                <svg v-if="isProfileComplete" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
            </div>
            <div class="status-text">
                <strong v-if="isProfileComplete">Profil Tim Lengkap!</strong>
                <strong v-else>Profil Tim Belum Lengkap</strong>
                <p v-if="!isProfileComplete">
                    {{ !profile?.logoUrl ? 'Upload logo tim. ' : '' }}
                    {{ (profile?.coaches?.length || 0) < 1 ? 'Tambahkan minimal 1 pelatih.' : '' }}
                </p>
            </div>
        </div>

        <!-- Error/Success Messages -->
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="success" class="alert alert-success">{{ success }}</div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading profile...</p>
        </div>

        <div v-else class="profile-content">
            <!-- Logo Section -->
            <div class="card logo-section">
                <h2>Logo Tim</h2>
                <div class="logo-upload-area">
                    <div class="logo-preview" :class="{ 'has-logo': logoPreview }">
                        <img v-if="logoPreview" :src="logoPreview" alt="Team Logo" />
                        <div v-else class="logo-placeholder">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                            </svg>
                            <span>No Logo</span>
                        </div>
                    </div>
                    <div class="upload-controls">
                        <label class="btn btn-primary" :class="{ 'loading': uploadingLogo }">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            {{ uploadingLogo ? 'Uploading...' : 'Upload Logo' }}
                            <input 
                                type="file" 
                                accept="image/*" 
                                @change="handleLogoUpload"
                                :disabled="uploadingLogo"
                                hidden
                            />
                        </label>
                        <p class="upload-hint">Format: JPG, PNG, WebP. Max 5MB</p>
                    </div>
                </div>
            </div>

            <!-- Coaches Section -->
            <div class="card coaches-section">
                <div class="section-header">
                    <div>
                        <h2>Pelatih</h2>
                        <p class="coach-limit">
                            {{ profile?.coaches?.length || 0 }} / {{ maxCoaches }} pelatih
                            <span v-if="athleteCount < 50" class="coach-hint">
                                (Daftarkan 50+ atlet untuk menambah hingga 4 pelatih)
                            </span>
                        </p>
                    </div>
                    <button 
                        v-if="canAddCoach && !showCoachForm"
                        @click="showCoachForm = true"
                        class="btn btn-primary btn-sm"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Tambah Pelatih
                    </button>
                </div>

                <!-- Coach Form -->
                <div v-if="showCoachForm" class="coach-form card">
                    <h3>Tambah Pelatih Baru</h3>
                    <form @submit.prevent="addCoach">
                        <div class="form-group">
                            <label class="form-label">Nama Pelatih *</label>
                            <input 
                                v-model="coachForm.name"
                                type="text" 
                                class="form-input"
                                placeholder="Masukkan nama pelatih"
                                required
                            />
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">No. Telepon</label>
                                <input 
                                    v-model="coachForm.phone"
                                    type="tel" 
                                    class="form-input"
                                    placeholder="08xxxxxxxxxx"
                                />
                            </div>
                            <div class="form-group">
                                <label class="form-label">Jabatan</label>
                                <select v-model="coachForm.role" class="form-input">
                                    <option value="head">Pelatih Kepala</option>
                                    <option value="assistant">Asisten Pelatih</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button 
                                type="button" 
                                @click="showCoachForm = false"
                                class="btn btn-secondary"
                            >
                                Batal
                            </button>
                            <button 
                                type="submit" 
                                class="btn btn-primary"
                                :disabled="savingCoach"
                            >
                                {{ savingCoach ? 'Menyimpan...' : 'Simpan Pelatih' }}
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Coach List -->
                <div class="coach-list">
                    <div 
                        v-for="coach in profile?.coaches" 
                        :key="coach.id"
                        class="coach-item"
                    >
                        <!-- Edit Mode -->
                        <template v-if="editingCoachId === coach.id">
                            <div class="coach-edit-form">
                                <div class="form-row">
                                    <input 
                                        v-model="editCoachForm.name" 
                                        class="form-input" 
                                        placeholder="Nama pelatih"
                                    />
                                    <input 
                                        v-model="editCoachForm.phone" 
                                        class="form-input" 
                                        placeholder="No. Telepon"
                                    />
                                    <select v-model="editCoachForm.role" class="form-input">
                                        <option value="head">Pelatih Kepala</option>
                                        <option value="assistant">Asisten</option>
                                    </select>
                                </div>
                                <div class="edit-actions">
                                    <button @click="saveEditCoach" class="btn btn-primary btn-sm" :disabled="saving">
                                        {{ saving ? 'Saving...' : 'Simpan' }}
                                    </button>
                                    <button @click="cancelEditCoach" class="btn btn-secondary btn-sm">Batal</button>
                                </div>
                            </div>
                        </template>
                        
                        <!-- View Mode -->
                        <template v-else>
                            <div class="coach-avatar">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                            <div class="coach-info">
                                <h4>{{ coach.name }}</h4>
                                <div class="coach-meta">
                                    <span class="badge" :class="coach.role === 'head' ? 'badge-primary' : 'badge-accent'">
                                        {{ coach.role === 'head' ? 'Pelatih Kepala' : 'Asisten' }}
                                    </span>
                                    <span v-if="coach.phone" class="coach-phone">{{ coach.phone }}</span>
                                </div>
                            </div>
                            <div class="coach-actions">
                                <button 
                                    @click="startEditCoach(coach)"
                                    class="btn-icon"
                                    title="Edit pelatih"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                </button>
                                <button 
                                    @click="removeCoach(coach.id)"
                                    class="btn-icon btn-danger-ghost"
                                    title="Hapus pelatih"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                </button>
                            </div>
                        </template>
                    </div>

                    <div v-if="!profile?.coaches?.length" class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <p>Belum ada pelatih terdaftar</p>
                        <button 
                            v-if="canAddCoach"
                            @click="showCoachForm = true"
                            class="btn btn-primary"
                        >
                            Tambah Pelatih Pertama
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.team-profile-page {
    padding: var(--space-6);
    max-width: 900px;
    margin: 0 auto;
}

.page-header {
    margin-bottom: var(--space-6);
}

.page-header h1 {
    font-size: var(--text-2xl);
    font-weight: 700;
    margin-bottom: var(--space-2);
}

.subtitle {
    color: var(--text-muted);
}

/* Status Banner */
.status-banner {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-6);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-6);
}

.status-banner.complete {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-banner.incomplete {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.status-banner.complete .status-icon {
    background: var(--success);
}

.status-banner.incomplete .status-icon {
    background: var(--warning);
}

.status-icon svg {
    width: 24px;
    height: 24px;
    stroke: #fff;
}

.status-text strong {
    display: block;
    font-size: var(--text-lg);
}

.status-text p {
    color: var(--text-muted);
    margin-top: var(--space-1);
}

/* Alerts */
.alert {
    padding: var(--space-4);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-4);
}

.alert-error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--error);
    border: 1px solid rgba(239, 68, 68, 0.3);
}

.alert-success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
    border: 1px solid rgba(16, 185, 129, 0.3);
}

/* Loading */
.loading-state {
    text-align: center;
    padding: var(--space-12);
}

.spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto var(--space-4);
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Profile Content */
.profile-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
}

/* Logo Section */
.logo-section h2 {
    font-size: var(--text-lg);
    margin-bottom: var(--space-4);
}

.logo-upload-area {
    display: flex;
    gap: var(--space-6);
    align-items: center;
}

.logo-preview {
    width: 150px;
    height: 150px;
    border-radius: var(--radius-lg);
    background: var(--bg-input);
    border: 2px dashed var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.logo-preview.has-logo {
    border-style: solid;
    border-color: var(--primary);
}

.logo-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.logo-placeholder {
    text-align: center;
    color: var(--text-dim);
}

.logo-placeholder svg {
    width: 48px;
    height: 48px;
    margin-bottom: var(--space-2);
}

.upload-controls {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.upload-controls .btn svg {
    width: 18px;
    height: 18px;
    margin-right: var(--space-2);
}

.upload-hint {
    font-size: var(--text-sm);
    color: var(--text-muted);
}

/* Coaches Section */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-4);
}

.section-header h2 {
    font-size: var(--text-lg);
    margin-bottom: var(--space-1);
}

.coach-limit {
    font-size: var(--text-sm);
    color: var(--text-muted);
}

.coach-hint {
    font-size: var(--text-xs);
    opacity: 0.8;
}

/* Coach Form */
.coach-form {
    background: var(--bg-input);
    padding: var(--space-6);
    margin-bottom: var(--space-4);
}

.coach-form h3 {
    font-size: var(--text-base);
    margin-bottom: var(--space-4);
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
}

.form-actions {
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;
    margin-top: var(--space-4);
}

/* Coach List */
.coach-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
}

.coach-item {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--bg-input);
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
}

.coach-item:hover {
    background: var(--bg-card-hover);
}

.coach-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary-light), var(--primary));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.coach-avatar svg {
    width: 24px;
    height: 24px;
    stroke: #fff;
}

.coach-info {
    flex: 1;
}

.coach-info h4 {
    font-size: var(--text-base);
    margin-bottom: var(--space-1);
}

.coach-meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-sm);
}

.coach-phone {
    color: var(--text-muted);
}

.btn-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-icon svg {
    width: 18px;
    height: 18px;
}

.btn-danger-ghost {
    color: var(--text-muted);
}

.btn-danger-ghost:hover {
    background: rgba(239, 68, 68, 0.1);
    color: var(--error);
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: var(--space-8);
    color: var(--text-muted);
}

.empty-state svg {
    width: 64px;
    height: 64px;
    margin-bottom: var(--space-4);
    stroke: var(--text-dim);
}

.empty-state p {
    margin-bottom: var(--space-4);
}

/* Responsive */
@media (max-width: 768px) {
    .team-profile-page {
        padding: var(--space-4);
    }

    .logo-upload-area {
        flex-direction: column;
        text-align: center;
    }

    .form-row {
        grid-template-columns: 1fr;
    }

    .section-header {
        flex-direction: column;
        gap: var(--space-3);
    }

    .section-header .btn {
        width: 100%;
    }
}

/* Coach Actions */
.coach-actions {
    display: flex;
    gap: var(--space-2);
}

/* Coach Edit Form */
.coach-edit-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
}

.coach-edit-form .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr 120px;
    gap: var(--space-3);
}

.edit-actions {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
}

.btn-sm {
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
}

@media (max-width: 768px) {
    .coach-edit-form .form-row {
        grid-template-columns: 1fr;
    }
}
</style>
