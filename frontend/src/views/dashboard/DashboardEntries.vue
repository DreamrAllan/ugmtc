<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useEntryStore } from '../../stores/entryStore'
import { teamApi } from '../../services/api'
import { 
    calculateAge, 
    getAgeCategory, 
    getWeightClasses, 
    categoryNames,
    eventModes,
    eventTypes,
    beltRanks
} from '../../data/categories'

const authStore = useAuthStore()
const entryStore = useEntryStore()

const user = computed(() => authStore.currentUser)
const myEntries = computed(() => entryStore.getEntriesByUser(user.value?.id))

// Team profile check
const teamProfileComplete = ref(false)
const teamProfileLoading = ref(true)
const teamProfileError = ref('')

// Filter tabs
const activeTab = ref('draft') // 'draft' or 'submitted'
const draftEntries = computed(() => myEntries.value.filter(e => e.status === 'draft'))
const submittedEntries = computed(() => myEntries.value.filter(e => e.status !== 'draft'))

// Submit drafts
const submitting = ref(false)

// Check team profile on mount
const checkTeamProfile = async () => {
    teamProfileLoading.value = true
    try {
        const status = await teamApi.getStatus()
        teamProfileComplete.value = status.isComplete
    } catch (err) {
        teamProfileError.value = err.message
    } finally {
        teamProfileLoading.value = false
    }
}

onMounted(() => {
    checkTeamProfile()
    entryStore.loadEntries()
})

// Edit mode
const editingEntry = ref(null)

// File refs to store actual File objects for upload
const fileRefs = ref({
    photo: null,
    idDocument: null,
    beltCertificate: null
})

// Form state
const showForm = ref(false)
const showDetail = ref(false)
const showConfirmSubmit = ref(false)
const selectedEntry = ref(null)

const form = ref({
    fullName: '',
    birthPlace: '',
    birthDate: '',
    gender: 'male',
    weight: '',
    height: '',
    eventMode: 'prestasi',
    eventType: 'kyorugi',
    weightClass: '',
    beltRank: '',
    photo: null,
    photoName: '',
    idDocument: null,
    idDocumentName: '',
    beltCertificate: null,
    beltCertificateName: ''
})

// Auto-calculated fields
const calculatedAge = computed(() => {
    if (!form.value.birthDate) return null
    return calculateAge(form.value.birthDate)
})

const autoCategory = computed(() => {
    if (!form.value.birthDate) return null
    return getAgeCategory(form.value.birthDate, form.value.eventMode)
})

const autoCategoryName = computed(() => {
    if (!autoCategory.value) return 'Usia tidak memenuhi'
    return categoryNames[autoCategory.value]
})

const availableWeightClasses = computed(() => {
    if (!autoCategory.value) return []
    return getWeightClasses(autoCategory.value, form.value.gender, form.value.eventMode)
})

// Watch for changes to reset weight class when dependencies change
watch([() => form.value.birthDate, () => form.value.gender, () => form.value.eventMode], () => {
    form.value.weightClass = ''
})

const handlePhotoUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran foto maksimal 2MB')
        return
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
        alert('Format foto harus JPG atau PNG')
        return
    }
    
    // Store actual file for upload
    fileRefs.value.photo = file
    
    const reader = new FileReader()
    reader.onload = (e) => {
        form.value.photo = e.target.result
        form.value.photoName = file.name
    }
    reader.readAsDataURL(file)
}

const handleFileUpload = (event, type) => {
    const file = event.target.files[0]
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB')
        return
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!validTypes.includes(file.type)) {
        alert('Format file harus JPG, PNG, atau PDF')
        return
    }
    
    // Store actual file for upload
    if (type === 'id') {
        fileRefs.value.idDocument = file
    } else {
        fileRefs.value.beltCertificate = file
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
        if (type === 'id') {
            form.value.idDocument = e.target.result
            form.value.idDocumentName = file.name
        } else {
            form.value.beltCertificate = e.target.result
            form.value.beltCertificateName = file.name
        }
    }
    reader.readAsDataURL(file)
}

const removeFile = (type) => {
    if (type === 'photo') {
        form.value.photo = null
        form.value.photoName = ''
    } else if (type === 'id') {
        form.value.idDocument = null
        form.value.idDocumentName = ''
    } else {
        form.value.beltCertificate = null
        form.value.beltCertificateName = ''
    }
}

const resetForm = () => {
    form.value = {
        fullName: '',
        birthPlace: '',
        birthDate: '',
        gender: 'male',
        weight: '',
        height: '',
        eventMode: 'prestasi',
        eventType: 'kyorugi',
        weightClass: '',
        beltRank: '',
        photo: null,
        photoName: '',
        idDocument: null,
        idDocumentName: '',
        beltCertificate: null,
        beltCertificateName: ''
    }
    // Clear file refs
    fileRefs.value = {
        photo: null,
        idDocument: null,
        beltCertificate: null
    }
}

const openAddForm = () => {
    resetForm()
    showForm.value = true
}

const openDetail = (entry) => {
    selectedEntry.value = entry
    showDetail.value = true
}

const submitEntry = async () => {
    if (!form.value.fullName || !form.value.birthDate || !form.value.weightClass || !form.value.beltRank) {
        alert('Mohon lengkapi semua data wajib')
        return
    }

    if (!form.value.photo) {
        alert('Mohon upload foto diri 3x4')
        return
    }

    if (!autoCategory.value) {
        alert('Usia atlet tidak memenuhi syarat')
        return
    }

    try {
        // Step 1: Create Athlete first
        const { athletesApi, entriesApi } = await import('../../services/api')
        
        const athleteResponse = await athletesApi.create({
            fullName: form.value.fullName,
            birthPlace: form.value.birthPlace,
            birthDate: form.value.birthDate,
            gender: form.value.gender,
            weight: parseFloat(form.value.weight),
            height: parseFloat(form.value.height),
            beltRank: form.value.beltRank
        }, {
            photo: fileRefs.value.photo,
            idDocument: fileRefs.value.idDocument,
            beltCertificate: fileRefs.value.beltCertificate
        })

        // Step 2: Create Entry with athleteId
        const entryResponse = await entriesApi.create({
            athleteId: athleteResponse.athlete.id,
            category: form.value.eventType, // kyorugi or poomsae
            eventType: form.value.eventMode, // prestasi or festival
            ageClass: autoCategory.value,
            weightClass: form.value.weightClass,
            teamName: user.value?.teamName
        })

        // Refresh entries
        await entryStore.loadEntries()
        
        showForm.value = false
        resetForm()
        alert('Entry berhasil disimpan sebagai draft!')
    } catch (err) {
        console.error('Submit entry error:', err)
        alert('Gagal menyimpan entry: ' + err.message)
    }
}

const deleteEntry = async (entryId) => {
    if (!confirm('Hapus entry ini?')) return
    
    try {
        await entryStore.deleteEntry(entryId)
        alert('Entry berhasil dihapus!')
    } catch (err) {
        console.error('Delete entry error:', err)
        alert('Gagal menghapus: ' + err.message)
    }
}

// Edit entry - for drafts, reopen the form with edited data
const editEntry = (entry) => {
    // Populate form with existing data
    form.value = {
        fullName: entry.athlete?.fullName || '',
        birthPlace: entry.athlete?.birthPlace || '',
        birthDate: entry.athlete?.birthDate?.split('T')[0] || '',
        gender: entry.athlete?.gender || 'male',
        weight: entry.athlete?.weight?.toString() || '',
        height: entry.athlete?.height?.toString() || '',
        eventMode: entry.eventType || 'prestasi',
        eventType: entry.category || 'kyorugi',
        weightClass: entry.weightClass || '',
        beltRank: entry.athlete?.beltRank || '',
        photo: entry.athlete?.photo || null,
        photoName: '',
        idDocument: entry.athlete?.idDocument || null,
        idDocumentName: '',
        beltCertificate: entry.athlete?.beltCertificate || null,
        beltCertificateName: ''
    }
    editingEntry.value = entry
    showForm.value = true
    showDetail.value = false
}

const getStatusBadge = (status) => {
    switch (status) {
        case 'draft': return { class: 'badge-draft', text: 'Draft' }
        case 'pending': return { class: 'badge-warning', text: 'Pending' }
        case 'approved': return { class: 'badge-success', text: 'Approved' }
        case 'rejected': return { class: 'badge-error', text: 'Rejected' }
        default: return { class: 'badge-primary', text: status }
    }
}

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID')
}

// Get belt rank display name
const getBeltRankName = (beltRankId) => {
    if (!beltRankId) return '-'
    const rank = beltRanks.find(r => r.id === beltRankId)
    return rank ? rank.name : beltRankId
}

// Submit all drafts to admin
const submitAllDrafts = async () => {
    if (draftEntries.value.length === 0) {
        alert('Tidak ada entry draft untuk dikirim')
        return
    }
    
    if (!confirm(`Kirim ${draftEntries.value.length} entry ke admin? Entry tidak bisa diedit setelah dikirim.`)) {
        return
    }
    
    submitting.value = true
    try {
        const result = await entryStore.submitDrafts()
        alert(result.message)
    } catch (err) {
        alert('Gagal mengirim: ' + err.message)
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <div class="dashboard-entries">
        <!-- Team Profile Incomplete Warning -->
        <div v-if="!teamProfileLoading && !teamProfileComplete" class="profile-warning card">
            <div class="warning-content">
                <div class="warning-icon">⚠️</div>
                <div class="warning-text">
                    <strong>Lengkapi Profil Tim Terlebih Dahulu</strong>
                    <p>Anda harus mengunggah logo tim dan menambahkan minimal 1 pelatih sebelum dapat mendaftarkan atlet.</p>
                </div>
                <RouterLink to="/dashboard/team" class="btn btn-primary">Lengkapi Profil Tim</RouterLink>
            </div>
        </div>

        <div class="page-header">
            <div>
                <h1>Entry Atlet</h1>
                <p class="page-subtitle">Daftarkan atlet untuk mendapatkan slot pertandingan</p>
            </div>
            <div class="header-actions">
                <button 
                    v-if="draftEntries.length > 0"
                    @click="submitAllDrafts" 
                    class="btn btn-success"
                    :disabled="submitting"
                >
                    {{ submitting ? 'Mengirim...' : 'Kirim Entry Atlet' }}
                </button>
                <button 
                    @click="openAddForm" 
                    class="btn btn-primary"
                    :disabled="!teamProfileComplete"
                    :title="!teamProfileComplete ? 'Lengkapi profil tim terlebih dahulu' : ''"
                >
                    + Entry Baru
                </button>
            </div>
        </div>

        <!-- Filter Tabs -->
        <div v-if="myEntries.length > 0" class="filter-tabs">
            <button 
                class="tab-btn"
                :class="{ active: activeTab === 'draft' }"
                @click="activeTab = 'draft'"
            >
                Draft ({{ draftEntries.length }})
            </button>
            <button 
                class="tab-btn"
                :class="{ active: activeTab === 'submitted' }"
                @click="activeTab = 'submitted'"
            >
                Terkirim ({{ submittedEntries.length }})
            </button>
        </div>

        <!-- Entry List -->
        <div v-if="myEntries.length === 0" class="empty-state card">
            <h3>Belum ada entry atlet</h3>
            <p v-if="teamProfileComplete">Daftarkan atlet Anda untuk mengikuti UGMTC 2026</p>
            <p v-else>Lengkapi profil tim terlebih dahulu untuk dapat mendaftarkan atlet</p>
            <button 
                v-if="teamProfileComplete"
                @click="openAddForm" 
                class="btn btn-primary"
            >
                + Entry Atlet Pertama
            </button>
            <RouterLink v-else to="/dashboard/team" class="btn btn-primary">Lengkapi Profil Tim</RouterLink>
        </div>

        <!-- Draft Entries -->
        <div v-else-if="activeTab === 'draft'" class="entries-section">
            <div v-if="draftEntries.length === 0" class="empty-state card">
                <p>Tidak ada entry draft. Semua entry sudah terkirim ke admin.</p>
            </div>
            <div v-else class="entries-grid">
                <div v-for="entry in draftEntries" :key="entry.id" class="entry-card card">
                    <div class="entry-header">
                        <div class="entry-photo" v-if="entry.athlete?.photo">
                            <img :src="entry.athlete.photo" :alt="entry.athlete?.fullName">
                        </div>
                        <div class="entry-avatar" v-else>{{ entry.athlete?.fullName?.charAt(0) || 'A' }}</div>
                        <span class="badge badge-draft">Draft</span>
                    </div>
                    <h3 class="entry-name">{{ entry.athlete?.fullName }}</h3>
                    <div class="entry-tags">
                        <span class="tag tag-category">{{ entry.ageClass }}</span>
                        <span class="tag tag-class">{{ entry.weightClass || entry.category }}</span>
                    </div>
                    <div class="entry-meta">
                        {{ entry.eventType }} - {{ entry.category }}
                    </div>
                    <div class="entry-footer">
                        <span class="entry-date">{{ formatDate(entry.createdAt) }}</span>
                        <div class="entry-actions">
                            <button @click.stop="editEntry(entry)" class="btn-icon" title="Edit">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                            <button @click.stop="deleteEntry(entry.id)" class="btn-icon btn-danger-ghost" title="Hapus">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                            </button>
                            <button @click.stop="openDetail(entry)" class="btn-sm btn-secondary">Detail</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Submitted Entries -->
        <div v-else class="entries-section">
            <div v-if="submittedEntries.length === 0" class="empty-state card">
                <p>Belum ada entry yang terkirim ke admin.</p>
            </div>
            <div v-else class="entries-grid">
                <div v-for="entry in submittedEntries" :key="entry.id" class="entry-card card" @click="openDetail(entry)">
                    <div class="entry-header">
                        <div class="entry-photo" v-if="entry.athlete?.photo">
                            <img :src="entry.athlete.photo" :alt="entry.athlete?.fullName">
                        </div>
                        <div class="entry-avatar" v-else>{{ entry.athlete?.fullName?.charAt(0) || 'A' }}</div>
                        <span class="badge" :class="getStatusBadge(entry.status).class">
                            {{ getStatusBadge(entry.status).text }}
                        </span>
                    </div>
                    <h3 class="entry-name">{{ entry.athlete?.fullName }}</h3>
                    <div class="entry-tags">
                        <span class="tag tag-category">{{ entry.ageClass }}</span>
                        <span class="tag tag-class">{{ entry.weightClass || entry.category }}</span>
                    </div>
                    <div class="entry-meta">
                        {{ entry.eventType }} - {{ entry.category }}
                    </div>
                    <div class="entry-footer">
                        <span class="entry-date">{{ formatDate(entry.createdAt) }}</span>
                        <span class="view-detail">Lihat Detail →</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Detail Modal -->
        <div v-if="showDetail && selectedEntry" class="modal-overlay" @click.self="showDetail = false">
            <div class="modal detail-modal">
                <div class="modal-header">
                    <h3>Detail Atlet</h3>
                    <button @click="showDetail = false" class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="detail-grid">
                        <!-- Photo Section -->
                        <div class="detail-photo-section">
                            <div class="detail-photo" v-if="selectedEntry.athlete?.photo">
                                <img :src="selectedEntry.athlete.photo" :alt="selectedEntry.athlete?.fullName">
                            </div>
                            <div class="detail-photo placeholder" v-else>
                                <span>📷</span>
                                <small>Tidak ada foto</small>
                            </div>
                            <span class="badge large" :class="getStatusBadge(selectedEntry.status).class">
                                {{ getStatusBadge(selectedEntry.status).text }}
                            </span>
                        </div>

                        <!-- Info Section -->
                        <div class="detail-info-section">
                            <h2 class="detail-name">{{ selectedEntry.athlete?.fullName || 'Nama Atlet' }}</h2>
                            
                            <!-- Progress-style Info Cards -->
                            <div class="info-progress-grid">
                                <div class="info-progress-item">
                                    <div class="info-progress-header">
                                        <span class="info-progress-label">Kategori Usia</span>
                                        <span class="info-progress-value">{{ selectedEntry.ageClass || selectedEntry.athlete?.categoryName || '-' }}</span>
                                    </div>
                                    <div class="info-progress-bar bg-category"></div>
                                </div>
                                <div class="info-progress-item">
                                    <div class="info-progress-header">
                                        <span class="info-progress-label">Kelas Tanding</span>
                                        <span class="info-progress-value">{{ selectedEntry.weightClass || selectedEntry.athlete?.weightClass || '-' }}</span>
                                    </div>
                                    <div class="info-progress-bar bg-class"></div>
                                </div>
                                <div class="info-progress-item">
                                    <div class="info-progress-header">
                                        <span class="info-progress-label">Mode</span>
                                        <span class="info-progress-value">{{ selectedEntry.eventType || selectedEntry.athlete?.eventMode || '-' }}</span>
                                    </div>
                                    <div class="info-progress-bar bg-mode"></div>
                                </div>
                                <div class="info-progress-item">
                                    <div class="info-progress-header">
                                        <span class="info-progress-label">Event</span>
                                        <span class="info-progress-value">{{ selectedEntry.category || selectedEntry.athlete?.eventType || '-' }}</span>
                                    </div>
                                    <div class="info-progress-bar bg-event"></div>
                                </div>
                            </div>
                            
                            <div class="detail-rows">
                                <div class="detail-row">
                                    <span class="label">Tempat, Tanggal Lahir</span>
                                    <span class="value">{{ selectedEntry.athlete?.birthPlace || '-' }}, {{ formatDate(selectedEntry.athlete?.birthDate) }}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Usia (saat kompetisi)</span>
                                    <span class="value">{{ selectedEntry.athlete?.age || calculateAge(selectedEntry.athlete?.birthDate) || '-' }} tahun</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Jenis Kelamin</span>
                                    <span class="value">{{ selectedEntry.athlete?.gender === 'male' ? 'Putra (L)' : 'Putri (P)' }}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Tinggi Badan</span>
                                    <span class="value">{{ selectedEntry.athlete?.height || '-' }} cm</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Berat Badan</span>
                                    <span class="value">{{ selectedEntry.athlete?.weight || '-' }} kg</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Tingkatan Sabuk</span>
                                    <span class="value">{{ getBeltRankName(selectedEntry.athlete?.beltRank) }}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Tim</span>
                                    <span class="value">{{ selectedEntry.teamName || '-' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Document Previews Section -->
                    <div class="document-previews-section">
                        <h4>📎 Dokumen Upload</h4>
                        <div class="doc-grid">
                            <!-- Foto Atlet -->
                            <div class="doc-card">
                                <div class="doc-card-header">
                                    <span class="doc-icon">📷</span>
                                    <span class="doc-title">Foto 3x4</span>
                                </div>
                                <div class="doc-preview" v-if="selectedEntry.athlete?.photo">
                                    <img :src="selectedEntry.athlete.photo" alt="Foto Atlet">
                                </div>
                                <div class="doc-empty" v-else>
                                    <span>Belum ada foto</span>
                                </div>
                            </div>

                            <!-- KTP / Akte -->
                            <div class="doc-card">
                                <div class="doc-card-header">
                                    <span class="doc-icon">📄</span>
                                    <span class="doc-title">KTP / Akte Lahir</span>
                                </div>
                                <div class="doc-preview" v-if="selectedEntry.athlete?.idDocument">
                                    <img v-if="!selectedEntry.athlete.idDocument.includes('.pdf')" 
                                         :src="selectedEntry.athlete.idDocument" 
                                         alt="KTP/Akte">
                                    <div v-else class="doc-pdf">
                                        <span>📁 PDF File</span>
                                        <a :href="selectedEntry.athlete.idDocument" target="_blank" class="btn-sm btn-secondary">Lihat PDF</a>
                                    </div>
                                </div>
                                <div class="doc-empty" v-else>
                                    <span>Belum diupload</span>
                                </div>
                            </div>

                            <!-- Sertifikat Sabuk -->
                            <div class="doc-card">
                                <div class="doc-card-header">
                                    <span class="doc-icon">🥋</span>
                                    <span class="doc-title">Sertifikat Sabuk</span>
                                </div>
                                <div class="doc-preview" v-if="selectedEntry.athlete?.beltCertificate">
                                    <img v-if="!selectedEntry.athlete.beltCertificate.includes('.pdf')" 
                                         :src="selectedEntry.athlete.beltCertificate" 
                                         alt="Sertifikat Sabuk">
                                    <div v-else class="doc-pdf">
                                        <span>📁 PDF File</span>
                                        <a :href="selectedEntry.athlete.beltCertificate" target="_blank" class="btn-sm btn-secondary">Lihat PDF</a>
                                    </div>
                                </div>
                                <div class="doc-empty" v-else>
                                    <span>Belum diupload</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="selectedEntry.notes" class="detail-notes">
                        <h4>📝 Catatan Admin</h4>
                        <p>{{ selectedEntry.notes }}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button 
                        v-if="selectedEntry.status === 'draft'"
                        @click="deleteEntry(selectedEntry.id); showDetail = false" 
                        class="btn btn-danger"
                    >
                        Hapus Entry
                    </button>
                    <button @click="showDetail = false" class="btn btn-secondary">Tutup</button>
                </div>
            </div>
        </div>

        <!-- Entry Form Modal -->
        <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
            <div class="modal compact">
                <div class="modal-header">
                    <h3>Entry Atlet Baru</h3>
                    <button @click="showForm = false" class="modal-close">×</button>
                </div>
                
                <form @submit.prevent="submitEntry" class="modal-body">
                    <!-- Photo Upload -->
                    <div class="form-group photo-section">
                        <label class="form-label">Foto 3x4 (Background Biru/Merah) *</label>
                        <div class="photo-upload">
                            <input 
                                type="file" 
                                id="photoUpload" 
                                accept=".jpg,.jpeg,.png" 
                                @change="handlePhotoUpload"
                                class="file-input"
                            >
                            <label v-if="!form.photo" for="photoUpload" class="photo-placeholder">
                                <span class="photo-icon">📷</span>
                                <span>Upload Foto</span>
                                <span class="photo-hint">3x4, max 2MB</span>
                            </label>
                            <div v-else class="photo-preview">
                                <img :src="form.photo" alt="Preview">
                                <button type="button" @click="removeFile('photo')" class="photo-remove">×</button>
                            </div>
                        </div>
                    </div>

                    <!-- Name -->
                    <div class="form-group">
                        <label class="form-label">Nama Lengkap *</label>
                        <input v-model="form.fullName" type="text" class="form-input" placeholder="Nama atlet" required>
                    </div>
                    
                    <!-- Birth Info -->
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Tempat Lahir *</label>
                            <input v-model="form.birthPlace" type="text" class="form-input" placeholder="Kota" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tanggal Lahir *</label>
                            <input v-model="form.birthDate" type="date" class="form-input" required>
                        </div>
                    </div>

                    <!-- Auto Category Display -->
                    <div v-if="form.birthDate" class="auto-category-display">
                        <div class="category-info" :class="{ 'invalid': !autoCategory }">
                            <span class="category-label">Kategori:</span>
                            <span class="category-value">{{ autoCategoryName }}</span>
                            <span class="age-info" v-if="calculatedAge">({{ calculatedAge }} tahun)</span>
                        </div>
                    </div>
                    
                    <!-- Gender & Event Mode -->
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Jenis Kelamin *</label>
                            <select v-model="form.gender" class="form-input">
                                <option value="male">Putra</option>
                                <option value="female">Putri</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mode Event *</label>
                            <div class="toggle-buttons">
                                <button 
                                    v-for="mode in eventModes" 
                                    :key="mode.id"
                                    type="button"
                                    class="toggle-btn"
                                    :class="{ active: form.eventMode === mode.id }"
                                    @click="form.eventMode = mode.id"
                                >
                                    {{ mode.name }}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Event Type -->
                    <div class="form-group">
                        <label class="form-label">Jenis Event *</label>
                        <div class="toggle-buttons">
                            <button 
                                v-for="et in eventTypes" 
                                :key="et.id"
                                type="button"
                                class="toggle-btn"
                                :class="{ active: form.eventType === et.id }"
                                @click="form.eventType = et.id"
                            >
                                {{ et.name }}
                            </button>
                        </div>
                    </div>

                    <!-- Weight Class Selection -->
                    <div v-if="autoCategory && form.eventType === 'kyorugi'" class="form-group">
                        <label class="form-label">Pilih Kelas *</label>
                        <div class="weight-classes">
                            <button 
                                v-for="wc in availableWeightClasses" 
                                :key="wc"
                                type="button"
                                class="weight-class-btn"
                                :class="{ 
                                    active: form.weightClass === wc,
                                    male: form.gender === 'male',
                                    female: form.gender === 'female'
                                }"
                                @click="form.weightClass = wc"
                            >
                                {{ wc }}
                            </button>
                        </div>
                    </div>

                    <!-- Poomsae category field -->
                    <div v-if="form.eventType === 'poomsae'" class="form-group">
                        <label class="form-label">Kategori Poomsae *</label>
                        <select v-model="form.weightClass" class="form-input" required>
                            <option value="">Pilih kategori</option>
                            <option value="Individual">Individual</option>
                            <option value="Pair">Pair</option>
                            <option value="Team">Team</option>
                        </select>
                    </div>
                    
                    <!-- Height & Weight -->
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Tinggi (cm) *</label>
                            <input v-model="form.height" type="number" class="form-input" placeholder="170" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Berat (kg) *</label>
                            <input v-model="form.weight" type="number" class="form-input" placeholder="65" required>
                        </div>
                    </div>

                    <!-- Belt Rank -->
                    <div class="form-group">
                        <label class="form-label">Tingkatan Sabuk *</label>
                        <select v-model="form.beltRank" class="form-input" required>
                            <option value="">Pilih tingkatan</option>
                            <optgroup label="Geup (Sabuk Warna)">
                                <option v-for="belt in beltRanks.filter(b => b.type === 'geup')" :key="belt.id" :value="belt.id">
                                    {{ belt.name }}
                                </option>
                            </optgroup>
                            <optgroup label="Poom (Anak-anak)">
                                <option v-for="belt in beltRanks.filter(b => b.type === 'poom')" :key="belt.id" :value="belt.id">
                                    {{ belt.name }}
                                </option>
                            </optgroup>
                            <optgroup label="Dan (Sabuk Hitam)">
                                <option v-for="belt in beltRanks.filter(b => b.type === 'dan')" :key="belt.id" :value="belt.id">
                                    {{ belt.name }}
                                </option>
                            </optgroup>
                        </select>
                    </div>

                    <!-- File Uploads -->
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">KTP/Akte Lahir</label>
                            <div class="file-upload">
                                <input 
                                    type="file" 
                                    id="idDoc" 
                                    accept=".jpg,.jpeg,.png,.pdf" 
                                    @change="(e) => handleFileUpload(e, 'id')"
                                    class="file-input"
                                >
                                <label for="idDoc" class="file-label" v-if="!form.idDocumentName">
                                    <span>+ Upload</span>
                                </label>
                                <div v-else class="file-preview">
                                    <span>{{ form.idDocumentName }}</span>
                                    <button type="button" @click="removeFile('id')" class="file-remove">×</button>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Sertifikat Sabuk</label>
                            <div class="file-upload">
                                <input 
                                    type="file" 
                                    id="beltCert" 
                                    accept=".jpg,.jpeg,.png,.pdf" 
                                    @change="(e) => handleFileUpload(e, 'belt')"
                                    class="file-input"
                                >
                                <label for="beltCert" class="file-label" v-if="!form.beltCertificateName">
                                    <span>+ Upload</span>
                                </label>
                                <div v-else class="file-preview">
                                    <span>{{ form.beltCertificateName }}</span>
                                    <button type="button" @click="removeFile('belt')" class="file-remove">×</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" @click="showForm = false" class="btn btn-secondary">Batal</button>
                        <button type="submit" class="btn btn-primary" :disabled="!autoCategory || !form.weightClass || !form.beltRank || !form.photo">
                            Kirim Entry
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard-entries {
    max-width: 1200px;
    margin: 0 auto;
}

/* Profile Warning */
.profile-warning {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    margin-bottom: var(--space-6);
}

.warning-content {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
}

.warning-icon {
    font-size: var(--text-2xl);
}

.warning-text {
    flex: 1;
}

.warning-text strong {
    display: block;
    margin-bottom: var(--space-1);
    color: var(--warning);
}

.warning-text p {
    color: var(--text-muted);
    font-size: var(--text-sm);
    margin: 0;
}

/* Header Actions */
.header-actions {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
}

/* Filter Tabs */
.filter-tabs {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-6);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: var(--space-2);
}

.tab-btn {
    padding: var(--space-2) var(--space-4);
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-weight: 500;
    cursor: pointer;
    border-radius: var(--radius-md) var(--radius-md) 0 0;
    transition: all var(--transition-fast);
    position: relative;
}

.tab-btn:hover {
    color: var(--text);
}

.tab-btn.active {
    color: var(--primary);
}

.tab-btn.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--primary);
}

/* Success Button */
.btn-success {
    background: var(--success);
    color: #fff;
    font-weight: 500;
}

.btn-success:hover {
    filter: brightness(1.1);
}

.btn-success:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Entry Actions */
.entry-actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
}

.btn-sm {
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    border-radius: var(--radius-sm);
}

.btn-icon {
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    color: var(--text-muted);
}

.btn-icon:hover {
    background: var(--bg-input);
    color: var(--text);
}

.btn-icon svg {
    width: 18px;
    height: 18px;
}

.btn-danger-ghost:hover {
    background: rgba(239, 68, 68, 0.1);
    color: var(--error);
}

/* Draft Badge */
.badge-draft {
    background: rgba(156, 163, 175, 0.2);
    color: var(--text-muted);
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
    flex-wrap: wrap;
    gap: var(--space-4);
}

.page-header h1 {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-1);
}

.page-subtitle {
    color: var(--text-muted);
    font-size: var(--text-sm);
}

.empty-state {
    text-align: center;
    padding: var(--space-12);
}

.empty-state h3 {
    margin-bottom: var(--space-2);
}

.empty-state p {
    color: var(--text-muted);
    margin-bottom: var(--space-4);
}

.entries-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--space-4);
}

.entry-card {
    padding: var(--space-4);
    cursor: pointer;
    transition: all var(--transition-fast);
}

.entry-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.entry-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-3);
}

.entry-photo {
    width: 50px;
    height: 65px;
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 2px solid var(--primary);
}

.entry-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.entry-avatar {
    width: 50px;
    height: 65px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary);
    color: #FFFFFF;
    font-weight: 700;
    font-size: var(--text-xl);
    border-radius: var(--radius-md);
}

.entry-name {
    font-size: var(--text-base);
    margin-bottom: var(--space-2);
}

.entry-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    margin-bottom: var(--space-2);
}

.tag {
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    font-weight: 500;
}

.tag-category {
    background: rgba(45, 106, 122, 0.15);
    color: var(--primary);
}

.tag-class {
    background: rgba(230, 126, 34, 0.15);
    color: var(--accent);
}

.tag-event {
    background: var(--bg-input);
    color: var(--text-muted);
}

.entry-meta {
    font-size: var(--text-xs);
    color: var(--text-muted);
    margin-bottom: var(--space-3);
}

.entry-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--space-3);
    border-top: 1px solid var(--border-color);
}

.entry-date {
    font-size: var(--text-xs);
    color: var(--text-muted);
}

.view-detail {
    font-size: var(--text-xs);
    color: var(--primary);
    font-weight: 500;
}

/* Detail Modal */
.detail-modal {
    max-width: 700px;
    width: 100%;
}

.detail-grid {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: var(--space-6);
}

.detail-photo-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
}

.detail-photo {
    width: 140px;
    height: 180px;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 3px solid var(--primary);
}

.detail-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.detail-photo.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-input);
    font-size: var(--text-4xl);
    font-weight: 700;
    color: var(--primary);
}

.badge.large {
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
}

.detail-info-section {
    flex: 1;
}

.detail-name {
    font-size: var(--text-xl);
    margin-bottom: var(--space-3);
}

.detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
}

.detail-rows {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
}

.detail-row {
    display: flex;
    justify-content: space-between;
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--border-color);
}

.detail-row .label {
    color: var(--text-muted);
    font-size: var(--text-sm);
}

.detail-row .value {
    font-weight: 500;
    font-size: var(--text-sm);
}

.detail-docs h4,
.detail-notes h4 {
    font-size: var(--text-sm);
    margin-bottom: var(--space-2);
}

.doc-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.doc-item {
    padding: var(--space-2) var(--space-3);
    background: var(--bg-input);
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
}

.detail-notes {
    margin-top: var(--space-4);
    padding: var(--space-3);
    background: rgba(239, 68, 68, 0.1);
    border-radius: var(--radius-md);
}

.detail-notes p {
    font-size: var(--text-sm);
    color: var(--error);
}

/* Labeled Tags */
.detail-tags-labeled {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
    margin-bottom: var(--space-4);
}

.tag-with-label {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
}

.tag-label {
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Info Progress Grid */
.info-progress-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
    margin-bottom: var(--space-4);
}

.info-progress-item {
    background: var(--bg-input);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    overflow: hidden;
}

.info-progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);
}

.info-progress-label {
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.info-progress-value {
    font-weight: 600;
    font-size: var(--text-sm);
}

.info-progress-bar {
    height: 4px;
    border-radius: 2px;
    width: 100%;
}

.info-progress-bar.bg-category {
    background: linear-gradient(90deg, #14b8a6, #0d9488);
}

.info-progress-bar.bg-class {
    background: linear-gradient(90deg, #f59e0b, #d97706);
}

.info-progress-bar.bg-mode {
    background: linear-gradient(90deg, #8b5cf6, #7c3aed);
}

.info-progress-bar.bg-event {
    background: linear-gradient(90deg, #3b82f6, #2563eb);
}

/* Improved Photo Placeholder */
.detail-photo.placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--bg-input);
    gap: var(--space-1);
}

.detail-photo.placeholder span {
    font-size: var(--text-3xl);
}

.detail-photo.placeholder small {
    font-size: var(--text-xs);
    color: var(--text-muted);
}

/* Document Previews Section */
.document-previews-section {
    margin-top: var(--space-5);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-color);
}

.document-previews-section h4 {
    font-size: var(--text-sm);
    margin-bottom: var(--space-4);
    font-weight: 600;
}

.doc-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
}

.doc-card {
    background: var(--bg-input);
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--border-color);
}

.doc-card-header {
    padding: var(--space-3);
    background: var(--bg-card);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    border-bottom: 1px solid var(--border-color);
}

.doc-icon {
    font-size: var(--text-lg);
}

.doc-title {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.doc-preview {
    padding: var(--space-2);
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.doc-preview img {
    max-width: 100%;
    max-height: 150px;
    object-fit: contain;
    border-radius: var(--radius-sm);
}

.doc-empty {
    padding: var(--space-4);
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: var(--text-sm);
    text-align: center;
}

.doc-pdf {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
}

@media (max-width: 768px) {
    .info-progress-grid {
        grid-template-columns: 1fr;
    }
    
    .doc-grid {
        grid-template-columns: 1fr;
    }
}

/* Document Previews (legacy) */
.document-previews {
    margin-top: var(--space-5);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-color);
}

.document-previews h4 {
    font-size: var(--text-sm);
    margin-bottom: var(--space-3);
    color: var(--text);
}

.doc-preview-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
}

.doc-preview-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.doc-preview-label {
    font-size: var(--text-sm);
    font-weight: 500;
}

.doc-preview-image {
    width: 100%;
    height: 160px;
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 2px solid var(--border-color);
    background: var(--bg-input);
}

.doc-preview-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #fff;
}

.doc-preview-file {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    background: var(--bg-input);
    border-radius: var(--radius-md);
    border: 2px dashed var(--border-color);
    font-size: var(--text-sm);
    color: var(--text-muted);
}

/* Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: var(--space-4);
}

.modal {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    width: 100%;
    border: 1px solid var(--border-color);
    max-height: 95vh;
    overflow-y: auto;
}

.modal.compact {
    max-width: 720px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    background: var(--bg-card);
    z-index: 1;
}

.modal-header h3 {
    font-size: var(--text-lg);
}

.modal-close {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-input);
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text);
    font-size: var(--text-lg);
    cursor: pointer;
}

.modal-body {
    padding: var(--space-4);
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    padding: var(--space-4);
    border-top: 1px solid var(--border-color);
}

/* Photo Upload */
.photo-section {
    margin-bottom: var(--space-4);
}

.photo-upload {
    display: flex;
    justify-content: center;
}

.photo-placeholder {
    width: 120px;
    height: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    background: var(--bg-input);
    border: 2px dashed var(--border-color);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-fast);
}

.photo-placeholder:hover {
    border-color: var(--primary);
}

.photo-icon {
    font-size: var(--text-2xl);
}

.photo-placeholder span {
    font-size: var(--text-xs);
    color: var(--text-muted);
}

.photo-hint {
    font-size: 10px !important;
}

.photo-preview {
    position: relative;
    width: 120px;
    height: 160px;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 2px solid var(--success);
}

.photo-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.photo-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--error);
    border: none;
    border-radius: var(--radius-full);
    color: #FFFFFF;
    font-size: var(--text-sm);
    cursor: pointer;
}

.form-group {
    margin-bottom: var(--space-3);
}

.form-label {
    display: block;
    margin-bottom: var(--space-1);
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-muted);
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
}

/* Auto Category Display */
.auto-category-display {
    margin-bottom: var(--space-3);
}

.category-info {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: rgba(45, 106, 122, 0.1);
    border: 1px solid var(--primary);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
}

.category-info.invalid {
    background: rgba(239, 68, 68, 0.1);
    border-color: var(--error);
}

.category-label {
    color: var(--text-muted);
}

.category-value {
    font-weight: 600;
    color: var(--primary);
}

.category-info.invalid .category-value {
    color: var(--error);
}

.age-info {
    color: var(--text-muted);
    font-size: var(--text-xs);
}

/* Toggle Buttons */
.toggle-buttons {
    display: flex;
    gap: var(--space-2);
}

.toggle-btn {
    flex: 1;
    padding: var(--space-2) var(--space-3);
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.toggle-btn:hover {
    border-color: var(--primary);
    color: var(--text);
}

.toggle-btn.active {
    background: var(--primary);
    border-color: var(--primary);
    color: #FFFFFF;
}

/* Weight Class Buttons */
.weight-classes {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
}

.weight-class-btn {
    padding: var(--space-2) var(--space-3);
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.weight-class-btn:hover {
    border-color: var(--primary);
}

.weight-class-btn.active.male {
    background: #3B82F6;
    border-color: #3B82F6;
    color: #FFFFFF;
}

.weight-class-btn.active.female {
    background: #EC4899;
    border-color: #EC4899;
    color: #FFFFFF;
}

/* File Upload */
.file-upload {
    position: relative;
}

.file-input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
}

.file-label {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-3);
    background: var(--bg-input);
    border: 1px dashed var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
}

.file-label:hover {
    border-color: var(--primary);
    color: var(--primary);
}

.file-preview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    background: var(--bg-input);
    border: 1px solid var(--success);
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
}

.file-preview span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.file-remove {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--error);
    border: none;
    border-radius: var(--radius-sm);
    color: #FFFFFF;
    font-size: var(--text-sm);
    cursor: pointer;
    flex-shrink: 0;
}

@media (max-width: 600px) {
    .form-row {
        grid-template-columns: 1fr;
    }
    
    .page-header {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .detail-grid {
        grid-template-columns: 1fr;
    }
    
    .detail-photo-section {
        align-items: center;
    }
}
</style>
