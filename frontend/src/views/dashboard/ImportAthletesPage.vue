<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { athletesApi } from '../../services/api'
import { useAthleteStore } from '../../stores/athleteStore'
import { beltRanks } from '../../data/categories'
import * as XLSX from 'xlsx'

const router = useRouter()
const athleteStore = useAthleteStore()

// Steps: 1=upload, 2=preview, 3=documents
const currentStep = ref(1)
const isLoading = ref(false)
const importMessage = ref('')
const importErrors = ref([])

// Excel data
const excelFile = ref(null)
const parsedAthletes = ref([])
const importedAthletes = ref([])
const dragOver = ref(false)

// Document upload tracking per athlete
const docUploads = ref({}) // { athleteId: { photo: File, idDocument: File, ... } }
const uploadStatus = ref({}) // { athleteId: 'idle' | 'uploading' | 'done' | 'error' }

// Belt rank helper
const getBeltName = (id) => {
    if (!id) return '-'
    const rank = beltRanks.find(r => r.id === id)
    return rank ? rank.name : id
}

// Format date for display
const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID')
}

// Step 1: Download template
const downloadTemplate = async () => {
    try {
        isLoading.value = true
        await athletesApi.downloadTemplate()
    } catch (err) {
        alert('Gagal download template: ' + err.message)
    } finally {
        isLoading.value = false
    }
}

// Step 1: Handle file selection
const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (file) processFile(file)
}

const handleDrop = (event) => {
    event.preventDefault()
    dragOver.value = false
    const file = event.dataTransfer?.files?.[0]
    if (file) processFile(file)
}

const handleDragOver = (event) => {
    event.preventDefault()
    dragOver.value = true
}

const handleDragLeave = () => {
    dragOver.value = false
}

const processFile = (file) => {
    const validExts = ['.xlsx', '.xls']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!validExts.includes(ext)) {
        alert('Format file harus .xlsx atau .xls')
        return
    }

    excelFile.value = file

    // Parse locally for preview
    const reader = new FileReader()
    reader.onload = (e) => {
        try {
            const wb = XLSX.read(e.target.result, { type: 'array' })
            const athletes = []
            let counter = 1

            // Helper: parse one row's common athlete fields
            const parseRow = (row) => {
                let birthDate = ''
                const bdRaw = row[3]
                if (typeof bdRaw === 'number') {
                    const d = new Date(Math.round((bdRaw - 25569) * 86400 * 1000))
                    birthDate = d.toLocaleDateString('id-ID')
                } else if (typeof bdRaw === 'string') {
                    birthDate = bdRaw
                }
                const genderRaw = String(row[4] || '').trim().toUpperCase()
                const gender = genderRaw === 'L' ? 'Putra' : genderRaw === 'P' ? 'Putri' : genderRaw
                return {
                    fullName: String(row[1] || '').trim(),
                    birthPlace: String(row[2] || '').trim(),
                    birthDate, gender,
                    weight: row[5] || 0, height: row[6] || 0,
                    beltRank: String(row[7] || '').trim(),
                    valid: !!(row[1] && row[2] && row[3] && row[4] && row[5] && row[6])
                }
            }

            // Parse Kyorugi sheet
            const kyorugiName = wb.SheetNames.find(n => n.toLowerCase().includes('kyorugi'))
            if (kyorugiName) {
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[kyorugiName], { header: 1 })
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i]
                    if (!row || row.length === 0 || !row[1]) continue
                    const a = parseRow(row)
                    athletes.push({ ...a, no: counter++, sheet: 'Kyorugi',
                        modeEvent: String(row[8] || '').trim(),
                        kelas: String(row[9] || '').trim(),
                        jenisEvent: 'Kyorugi', namaGrup: '' })
                }
            }

            // Parse Poomsae sheet
            const poomsaeName = wb.SheetNames.find(n => n.toLowerCase().includes('poomsae'))
            if (poomsaeName) {
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[poomsaeName], { header: 1 })
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i]
                    if (!row || row.length === 0 || !row[1]) continue
                    const a = parseRow(row)
                    athletes.push({ ...a, no: counter++, sheet: 'Poomsae',
                        modeEvent: String(row[8] || '').trim(),
                        kelas: String(row[9] || '').trim(),   // Jenis: Individu/Pair/Beregu
                        jenisEvent: 'Poomsae',
                        namaGrup: String(row[10] || '').trim() })
                }
            }

            // Legacy: single sheet fallback
            if (!kyorugiName && !poomsaeName) {
                const sheetName = wb.SheetNames.find(n => n.includes('Data Atlet')) || wb.SheetNames[0]
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 })
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i]
                    if (!row || row.length === 0 || !row[1]) continue
                    const a = parseRow(row)
                    athletes.push({ ...a, no: counter++, sheet: '-',
                        modeEvent: '', kelas: '', jenisEvent: '', namaGrup: '' })
                }
            }

            parsedAthletes.value = athletes
            if (athletes.length > 0) {
                currentStep.value = 2
            } else {
                alert('File Excel kosong atau format tidak sesuai')
            }
        } catch (err) {
            console.error('Parse error:', err)
            alert('Gagal membaca file Excel: ' + err.message)
        }
    }
    reader.readAsArrayBuffer(file)
}

// Step 2: Confirm import
const confirmImport = async () => {
    if (!excelFile.value) return

    isLoading.value = true
    importMessage.value = ''
    importErrors.value = []

    try {
        const result = await athletesApi.importExcel(excelFile.value)
        importMessage.value = result.message
        importErrors.value = result.errors || []
        importedAthletes.value = result.athletes || []

        // Initialize doc uploads for each athlete
        importedAthletes.value.forEach(a => {
            docUploads.value[a.id] = {}
            uploadStatus.value[a.id] = 'idle'
        })

        currentStep.value = 3
    } catch (err) {
        importMessage.value = ''
        importErrors.value = err.errors || [err.message]
        alert('Gagal import: ' + err.message)
    } finally {
        isLoading.value = false
    }
}

// Step 3: Handle document file selection per athlete
const handleDocFile = (athleteId, docType, event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!docUploads.value[athleteId]) {
        docUploads.value[athleteId] = {}
    }
    docUploads.value[athleteId][docType] = file
}

const removeDocFile = (athleteId, docType) => {
    if (docUploads.value[athleteId]) {
        delete docUploads.value[athleteId][docType]
    }
}

const getDocCount = (athleteId) => {
    const docs = docUploads.value[athleteId]
    if (!docs) return 0
    return Object.keys(docs).length
}

// Upload documents for one athlete
const uploadDocsForAthlete = async (athleteId) => {
    const files = docUploads.value[athleteId]
    if (!files || Object.keys(files).length === 0) {
        alert('Belum ada file yang dipilih')
        return
    }

    uploadStatus.value[athleteId] = 'uploading'
    try {
        const updated = await athleteStore.uploadAthleteDocuments(athleteId, files)
        uploadStatus.value[athleteId] = 'done'
        // Update local imported athletes list
        const idx = importedAthletes.value.findIndex(a => a.id === athleteId)
        if (idx !== -1) {
            importedAthletes.value[idx] = updated
        }
    } catch (err) {
        uploadStatus.value[athleteId] = 'error'
        alert('Gagal upload: ' + err.message)
    }
}

// Upload all documents at once
const uploadAllDocs = async () => {
    const athleteIds = Object.keys(docUploads.value).filter(id => {
        const files = docUploads.value[id]
        return files && Object.keys(files).length > 0 && uploadStatus.value[id] !== 'done'
    })

    if (athleteIds.length === 0) {
        alert('Tidak ada dokumen yang perlu diupload')
        return
    }

    for (const id of athleteIds) {
        await uploadDocsForAthlete(id)
    }
}

const allDocsDone = computed(() => {
    return importedAthletes.value.length > 0 &&
        importedAthletes.value.every(a => uploadStatus.value[a.id] === 'done')
})

const goToEntries = () => {
    router.push('/dashboard/entries')
}

const resetAll = () => {
    currentStep.value = 1
    excelFile.value = null
    parsedAthletes.value = []
    importedAthletes.value = []
    importMessage.value = ''
    importErrors.value = []
    docUploads.value = {}
    uploadStatus.value = {}
}
</script>

<template>
    <div class="import-athletes">
        <!-- Header -->
        <div class="page-header">
            <div>
                <h1>📥 Import Atlet via Excel</h1>
                <p class="page-subtitle">Masukkan banyak atlet sekaligus dari file Excel</p>
            </div>
            <button @click="$router.push('/dashboard/entries')" class="btn btn-secondary">
                ← Kembali
            </button>
        </div>

        <!-- Step Indicator -->
        <div class="steps-indicator">
            <div class="step" :class="{ active: currentStep >= 1, done: currentStep > 1 }">
                <div class="step-number">{{ currentStep > 1 ? '✓' : '1' }}</div>
                <span>Upload Excel</span>
            </div>
            <div class="step-line" :class="{ active: currentStep >= 2 }"></div>
            <div class="step" :class="{ active: currentStep >= 2, done: currentStep > 2 }">
                <div class="step-number">{{ currentStep > 2 ? '✓' : '2' }}</div>
                <span>Preview & Konfirmasi</span>
            </div>
            <div class="step-line" :class="{ active: currentStep >= 3 }"></div>
            <div class="step" :class="{ active: currentStep >= 3 }">
                <div class="step-number">3</div>
                <span>Upload Dokumen</span>
            </div>
        </div>

        <!-- Step 1: Upload -->
        <div v-if="currentStep === 1" class="step-content">
            <div class="upload-section card">
                <div class="template-section">
                    <div class="template-info">
                        <h3>📄 Download Template Terlebih Dahulu</h3>
                        <p>Download template Excel, isi data atlet, lalu upload kembali ke sini.</p>
                        <ul class="template-hints">
                            <li>Isi data di sheet "Kyorugi" dan/atau "Poomsae" sesuai kategori</li>
                            <li>Untuk Poomsae Pair/Beregu, isi Nama Grup yang sama untuk satu tim</li>
                            <li>Dokumen (foto, KTP/akte, surat sehat, sertif sabuk) diupload di langkah berikutnya</li>
                        </ul>
                    </div>
                    <button @click="downloadTemplate" class="btn btn-primary btn-download" :disabled="isLoading">
                        <span v-if="isLoading">⏳ Downloading...</span>
                        <span v-else>📥 Download Template Excel</span>
                    </button>
                </div>

                <div class="divider">
                    <span>Atau</span>
                </div>

                <div
                    class="drop-zone"
                    :class="{ 'drag-over': dragOver, 'has-file': excelFile }"
                    @drop="handleDrop"
                    @dragover="handleDragOver"
                    @dragleave="handleDragLeave"
                >
                    <input
                        type="file"
                        id="excelUpload"
                        accept=".xlsx,.xls"
                        @change="handleFileSelect"
                        class="file-input"
                    >
                    <label for="excelUpload" class="drop-label">
                        <div class="drop-icon">📊</div>
                        <div class="drop-text">
                            <strong>Drag & drop file Excel di sini</strong>
                            <span>atau klik untuk memilih file (.xlsx / .xls)</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>

        <!-- Step 2: Preview -->
        <div v-if="currentStep === 2" class="step-content">
            <div class="preview-section card">
                <div class="preview-header">
                    <div>
                        <h3>📋 Preview Data Atlet</h3>
                        <p class="file-name">File: {{ excelFile?.name }} — {{ parsedAthletes.length }} atlet ditemukan</p>
                    </div>
                    <div class="preview-actions">
                        <button @click="resetAll" class="btn btn-secondary">Ganti File</button>
                        <button
                            @click="confirmImport"
                            class="btn btn-success"
                            :disabled="isLoading || parsedAthletes.filter(a => a.valid).length === 0"
                        >
                            {{ isLoading ? '⏳ Mengimport...' : `✅ Konfirmasi Import (${parsedAthletes.filter(a => a.valid).length} atlet)` }}
                        </button>
                    </div>
                </div>

                <div v-if="importErrors.length > 0" class="error-box">
                    <h4>⚠️ Error:</h4>
                    <ul>
                        <li v-for="(err, i) in importErrors" :key="i">{{ err }}</li>
                    </ul>
                </div>

                <div class="table-wrapper">
                    <table class="preview-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama Lengkap</th>
                                <th>Tempat Lahir</th>
                                <th>Tgl Lahir</th>
                                <th>JK</th>
                                <th>BB (kg)</th>
                                <th>TB (cm)</th>
                                <th>Sabuk</th>
                                <th>Sheet</th>
                                <th>Mode</th>
                                <th>Kelas/Jenis</th>
                                <th>Nama Grup</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(a, i) in parsedAthletes" :key="i" :class="{ 'row-invalid': !a.valid }">
                                <td>{{ a.no }}</td>
                                <td class="name-cell">{{ a.fullName }}</td>
                                <td>{{ a.birthPlace }}</td>
                                <td>{{ a.birthDate }}</td>
                                <td>{{ a.gender }}</td>
                                <td>{{ a.weight }}</td>
                                <td>{{ a.height }}</td>
                                <td>{{ getBeltName(a.beltRank) }}</td>
                                <td><span class="badge" :class="a.sheet === 'Kyorugi' ? 'badge-kyorugi' : a.sheet === 'Poomsae' ? 'badge-poomsae' : ''">{{ a.sheet }}</span></td>
                                <td>{{ a.modeEvent || '-' }}</td>
                                <td>{{ a.kelas || '-' }}</td>
                                <td>{{ a.namaGrup || '-' }}</td>
                                <td>
                                    <span class="badge" :class="a.valid ? 'badge-success' : 'badge-error'">
                                        {{ a.valid ? '✓ Valid' : '✗ Data kurang' }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Step 3: Document Upload -->
        <div v-if="currentStep === 3" class="step-content">
            <div class="docs-section card">
                <div class="docs-header">
                    <div>
                        <h3>📎 Upload Dokumen Atlet</h3>
                        <p v-if="importMessage" class="success-msg">{{ importMessage }}</p>
                        <p class="docs-subtitle">Upload foto, scan KTP/akte, surat sehat, dan sertifikat sabuk untuk setiap atlet</p>
                    </div>
                    <div class="docs-actions">
                        <button @click="uploadAllDocs" class="btn btn-primary" :disabled="isLoading">
                            📤 Upload Semua Dokumen
                        </button>
                        <button @click="goToEntries" class="btn btn-success">
                            {{ allDocsDone ? '✅ Selesai → Entry Atlet' : 'Lewati → Entry Atlet' }}
                        </button>
                    </div>
                </div>

                <div v-if="importErrors.length > 0" class="warning-box">
                    <h4>⚠️ Peringatan saat import:</h4>
                    <ul>
                        <li v-for="(err, i) in importErrors" :key="i">{{ err }}</li>
                    </ul>
                </div>

                <div class="athletes-docs-list">
                    <div
                        v-for="athlete in importedAthletes"
                        :key="athlete.id"
                        class="athlete-doc-card"
                        :class="{
                            'status-done': uploadStatus[athlete.id] === 'done',
                            'status-error': uploadStatus[athlete.id] === 'error',
                            'status-uploading': uploadStatus[athlete.id] === 'uploading'
                        }"
                    >
                        <div class="athlete-doc-header">
                            <div class="athlete-info-row">
                                <div class="athlete-avatar">
                                    {{ athlete.fullName?.charAt(0)?.toUpperCase() || 'A' }}
                                </div>
                                <div class="athlete-details">
                                    <h4>{{ athlete.fullName }}</h4>
                                    <span class="athlete-meta">
                                        {{ athlete.birthPlace }} · {{ formatDate(athlete.birthDate) }} ·
                                        {{ athlete.gender === 'male' ? 'Putra' : 'Putri' }} ·
                                        {{ athlete.weight }}kg · {{ athlete.height }}cm
                                    </span>
                                </div>
                            </div>
                            <div class="athlete-doc-status">
                                <span v-if="uploadStatus[athlete.id] === 'done'" class="badge badge-success">✓ Uploaded</span>
                                <span v-else-if="uploadStatus[athlete.id] === 'uploading'" class="badge badge-warning">⏳ Uploading...</span>
                                <span v-else-if="uploadStatus[athlete.id] === 'error'" class="badge badge-error">✗ Error</span>
                                <span v-else class="badge badge-draft">{{ getDocCount(athlete.id) }} file dipilih</span>
                            </div>
                        </div>

                        <div class="doc-uploads-grid" v-if="uploadStatus[athlete.id] !== 'done'">
                            <!-- Foto 3x4 -->
                            <div class="doc-upload-item">
                                <label class="doc-upload-label">
                                    <span class="doc-icon">📷</span>
                                    <span class="doc-name">Foto 3x4</span>
                                    <span class="doc-hint">JPG/PNG, max 5MB</span>
                                </label>
                                <div class="doc-file-area">
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png"
                                        @change="handleDocFile(athlete.id, 'photo', $event)"
                                        :id="`photo-${athlete.id}`"
                                        class="file-input"
                                    >
                                    <label :for="`photo-${athlete.id}`" class="doc-file-btn" v-if="!docUploads[athlete.id]?.photo">
                                        Pilih File
                                    </label>
                                    <div v-else class="doc-file-selected">
                                        <span>{{ docUploads[athlete.id].photo.name }}</span>
                                        <button @click="removeDocFile(athlete.id, 'photo')" class="doc-remove">×</button>
                                    </div>
                                </div>
                            </div>

                            <!-- KTP / Akte -->
                            <div class="doc-upload-item">
                                <label class="doc-upload-label">
                                    <span class="doc-icon">📄</span>
                                    <span class="doc-name">KTP / Akte Lahir</span>
                                    <span class="doc-hint">JPG/PNG/PDF, max 5MB</span>
                                </label>
                                <div class="doc-file-area">
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        @change="handleDocFile(athlete.id, 'idDocument', $event)"
                                        :id="`id-${athlete.id}`"
                                        class="file-input"
                                    >
                                    <label :for="`id-${athlete.id}`" class="doc-file-btn" v-if="!docUploads[athlete.id]?.idDocument">
                                        Pilih File
                                    </label>
                                    <div v-else class="doc-file-selected">
                                        <span>{{ docUploads[athlete.id].idDocument.name }}</span>
                                        <button @click="removeDocFile(athlete.id, 'idDocument')" class="doc-remove">×</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Surat Sehat -->
                            <div class="doc-upload-item">
                                <label class="doc-upload-label">
                                    <span class="doc-icon">🏥</span>
                                    <span class="doc-name">Surat Sehat</span>
                                    <span class="doc-hint">JPG/PNG/PDF, max 5MB</span>
                                </label>
                                <div class="doc-file-area">
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        @change="handleDocFile(athlete.id, 'healthCertificate', $event)"
                                        :id="`health-${athlete.id}`"
                                        class="file-input"
                                    >
                                    <label :for="`health-${athlete.id}`" class="doc-file-btn" v-if="!docUploads[athlete.id]?.healthCertificate">
                                        Pilih File
                                    </label>
                                    <div v-else class="doc-file-selected">
                                        <span>{{ docUploads[athlete.id].healthCertificate.name }}</span>
                                        <button @click="removeDocFile(athlete.id, 'healthCertificate')" class="doc-remove">×</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Sertifikat Sabuk -->
                            <div class="doc-upload-item">
                                <label class="doc-upload-label">
                                    <span class="doc-icon">🥋</span>
                                    <span class="doc-name">Sertifikat Sabuk</span>
                                    <span class="doc-hint">JPG/PNG/PDF, max 5MB</span>
                                </label>
                                <div class="doc-file-area">
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        @change="handleDocFile(athlete.id, 'beltCertificate', $event)"
                                        :id="`belt-${athlete.id}`"
                                        class="file-input"
                                    >
                                    <label :for="`belt-${athlete.id}`" class="doc-file-btn" v-if="!docUploads[athlete.id]?.beltCertificate">
                                        Pilih File
                                    </label>
                                    <div v-else class="doc-file-selected">
                                        <span>{{ docUploads[athlete.id].beltCertificate.name }}</span>
                                        <button @click="removeDocFile(athlete.id, 'beltCertificate')" class="doc-remove">×</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- If done, show uploaded docs -->
                        <div v-else class="doc-done-grid">
                            <div class="doc-done-item" v-if="athlete.photo">📷 Foto ✓</div>
                            <div class="doc-done-item" v-if="athlete.idDocument">📄 KTP/Akte ✓</div>
                            <div class="doc-done-item" v-if="athlete.healthCertificate">🏥 Surat Sehat ✓</div>
                            <div class="doc-done-item" v-if="athlete.beltCertificate">🥋 Sertif Sabuk ✓</div>
                        </div>

                        <div class="athlete-doc-footer" v-if="uploadStatus[athlete.id] !== 'done'">
                            <button
                                @click="uploadDocsForAthlete(athlete.id)"
                                class="btn btn-primary btn-sm"
                                :disabled="getDocCount(athlete.id) === 0 || uploadStatus[athlete.id] === 'uploading'"
                            >
                                {{ uploadStatus[athlete.id] === 'uploading' ? '⏳ Uploading...' : '📤 Upload Dokumen' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.import-athletes {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1.5rem;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
}

.page-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary, #1a1a2e);
    margin: 0;
}

.page-subtitle {
    color: var(--text-secondary, #64748b);
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
}

/* Steps Indicator */
.steps-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
    gap: 0;
}

.step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    opacity: 0.4;
    transition: all 0.3s ease;
}

.step.active {
    opacity: 1;
}

.step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1rem;
    background: var(--surface, #e2e8f0);
    color: var(--text-secondary, #64748b);
    transition: all 0.3s ease;
}

.step.active .step-number {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
}

.step.done .step-number {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
}

.step span {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary, #64748b);
    white-space: nowrap;
}

.step.active span {
    color: var(--text-primary, #1a1a2e);
}

.step-line {
    width: 80px;
    height: 3px;
    background: var(--surface, #e2e8f0);
    margin: 0 0.5rem;
    margin-bottom: 1.5rem;
    border-radius: 2px;
    transition: background 0.3s ease;
}

.step-line.active {
    background: linear-gradient(90deg, #10b981, #6366f1);
}

/* Card */
.card {
    background: var(--card-bg, #ffffff);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid var(--border, #e2e8f0);
}

/* Step 1: Upload Section */
.template-section {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.5rem;
    margin-bottom: 1rem;
}

.template-info h3 {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
    color: var(--text-primary, #1a1a2e);
}

.template-info p {
    color: var(--text-secondary, #64748b);
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
}

.template-hints {
    font-size: 0.85rem;
    color: var(--text-secondary, #64748b);
    padding-left: 1.2rem;
    margin: 0;
}

.template-hints li {
    margin-bottom: 0.25rem;
}

.btn-download {
    white-space: nowrap;
    flex-shrink: 0;
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
}

.divider {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1.5rem 0;
    color: var(--text-secondary, #94a3b8);
    font-size: 0.85rem;
}

.divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border, #e2e8f0);
}

.drop-zone {
    border: 2px dashed var(--border, #cbd5e1);
    border-radius: 12px;
    padding: 3rem 2rem;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
}

.drop-zone:hover, .drop-zone.drag-over {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.04);
}

.drop-zone.has-file {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.04);
}

.file-input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
    pointer-events: none;
}

.drop-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
}

.drop-icon {
    font-size: 3rem;
}

.drop-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.drop-text strong {
    font-size: 1rem;
    color: var(--text-primary, #1a1a2e);
}

.drop-text span {
    font-size: 0.85rem;
    color: var(--text-secondary, #94a3b8);
}

/* Step 2: Preview */
.preview-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    gap: 1rem;
    flex-wrap: wrap;
}

.preview-header h3 {
    margin: 0;
    font-size: 1.1rem;
}

.file-name {
    color: var(--text-secondary, #64748b);
    font-size: 0.85rem;
    margin: 0.25rem 0 0;
}

.preview-actions {
    display: flex;
    gap: 0.75rem;
    flex-shrink: 0;
}

.table-wrapper {
    overflow-x: auto;
    border-radius: 10px;
    border: 1px solid var(--border, #e2e8f0);
}

.preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
}

.preview-table th {
    background: var(--surface, #f1f5f9);
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: var(--text-primary, #1a1a2e);
    border-bottom: 2px solid var(--border, #e2e8f0);
    white-space: nowrap;
}

.preview-table td {
    padding: 0.65rem 0.75rem;
    border-bottom: 1px solid var(--border, #f1f5f9);
    color: var(--text-primary, #334155);
}

.preview-table tr:hover {
    background: rgba(99, 102, 241, 0.03);
}

.row-invalid {
    background: rgba(239, 68, 68, 0.04) !important;
}

.name-cell {
    font-weight: 600;
}

.error-box, .warning-box {
    background: rgba(239, 68, 68, 0.06);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.warning-box {
    background: rgba(245, 158, 11, 0.06);
    border-color: rgba(245, 158, 11, 0.2);
}

.error-box h4, .warning-box h4 {
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
}

.error-box ul, .warning-box ul {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.85rem;
    color: var(--text-secondary, #64748b);
}

/* Step 3: Document Upload */
.docs-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    gap: 1rem;
    flex-wrap: wrap;
}

.docs-header h3 {
    margin: 0;
    font-size: 1.1rem;
}

.success-msg {
    color: #10b981;
    font-weight: 600;
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
}

.docs-subtitle {
    color: var(--text-secondary, #64748b);
    font-size: 0.85rem;
    margin: 0.25rem 0 0;
}

.docs-actions {
    display: flex;
    gap: 0.75rem;
    flex-shrink: 0;
}

.athletes-docs-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.athlete-doc-card {
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 12px;
    padding: 1.25rem;
    transition: all 0.3s ease;
}

.athlete-doc-card.status-done {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.03);
}

.athlete-doc-card.status-error {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.03);
}

.athlete-doc-card.status-uploading {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.03);
}

.athlete-doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.athlete-info-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.athlete-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.1rem;
    flex-shrink: 0;
}

.athlete-details h4 {
    margin: 0;
    font-size: 1rem;
    color: var(--text-primary, #1a1a2e);
}

.athlete-meta {
    font-size: 0.8rem;
    color: var(--text-secondary, #94a3b8);
}

.doc-uploads-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.doc-upload-item {
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 10px;
    padding: 0.75rem;
    background: var(--surface, #fafbfd);
}

.doc-upload-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.doc-icon {
    font-size: 1.2rem;
}

.doc-name {
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--text-primary, #1a1a2e);
}

.doc-hint {
    font-size: 0.7rem;
    color: var(--text-secondary, #94a3b8);
    margin-left: auto;
}

.doc-file-area {
    position: relative;
}

.doc-file-btn {
    display: block;
    width: 100%;
    padding: 0.5rem;
    text-align: center;
    border: 1px dashed var(--border, #cbd5e1);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.8rem;
    color: #6366f1;
    font-weight: 600;
    transition: all 0.2s ease;
}

.doc-file-btn:hover {
    background: rgba(99, 102, 241, 0.06);
    border-color: #6366f1;
}

.doc-file-selected {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 0.6rem;
    background: rgba(16, 185, 129, 0.06);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 8px;
    font-size: 0.75rem;
    color: #059669;
}

.doc-file-selected span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 160px;
}

.doc-remove {
    background: none;
    border: none;
    color: #ef4444;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 0 0.25rem;
    line-height: 1;
}

.doc-done-grid {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.doc-done-item {
    background: rgba(16, 185, 129, 0.08);
    color: #059669;
    padding: 0.4rem 0.75rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
}

.athlete-doc-footer {
    display: flex;
    justify-content: flex-end;
}

/* Buttons */
.btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.25rem;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
}

.btn-primary:hover:not(:disabled) {
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
    transform: translateY(-1px);
}

.btn-secondary {
    background: var(--surface, #f1f5f9);
    color: var(--text-primary, #334155);
}

.btn-secondary:hover:not(:disabled) {
    background: var(--surface-hover, #e2e8f0);
}

.btn-success {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
}

.btn-success:hover:not(:disabled) {
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
    transform: translateY(-1px);
}

.btn-sm {
    padding: 0.4rem 0.9rem;
    font-size: 0.8rem;
}

/* Badges */
.badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.7rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
}

.badge-success {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
}

.badge-error {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
}

.badge-warning {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
}

.badge-draft {
    background: rgba(100, 116, 139, 0.1);
    color: #64748b;
}

.badge-kyorugi {
    background: rgba(59, 130, 246, 0.12);
    color: #2563eb;
}

.badge-poomsae {
    background: rgba(168, 85, 247, 0.12);
    color: #7c3aed;
}

/* Responsive */
@media (max-width: 768px) {
    .import-athletes {
        padding: 1rem;
    }

    .page-header {
        flex-direction: column;
        gap: 1rem;
    }

    .template-section {
        flex-direction: column;
    }

    .preview-header {
        flex-direction: column;
    }

    .preview-actions {
        width: 100%;
        flex-direction: column;
    }

    .docs-header {
        flex-direction: column;
    }

    .docs-actions {
        width: 100%;
        flex-direction: column;
    }

    .athlete-doc-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .doc-uploads-grid {
        grid-template-columns: 1fr;
    }

    .steps-indicator {
        transform: scale(0.85);
    }

    .step-line {
        width: 40px;
    }

    .btn {
        width: 100%;
        justify-content: center;
    }
}
</style>
