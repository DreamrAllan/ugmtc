<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useEntryStore } from '../../stores/entryStore'
import { categoryNames } from '../../data/categories'

const authStore = useAuthStore()
const entryStore = useEntryStore()

const loading = ref(true)
const activeTab = ref('pending')
const activeFilter = ref('all') // all, prestasi, festival
const expandedTeams = ref([])
const rejectNotes = ref('')
const selectedEntry = ref(null)
const showRejectModal = ref(false)
const showDetailModal = ref(false)

// Load entries on mount
onMounted(async () => {
    try {
        loading.value = true
        await entryStore.loadEntries()
    } catch (e) {
        console.error('Failed to load entries:', e)
    } finally {
        loading.value = false
    }
})

const tabs = [
    { id: 'pending', label: 'Pending', count: () => filteredByTab('pending').length },
    { id: 'approved', label: 'Approved', count: () => filteredByTab('approved').length },
    { id: 'rejected', label: 'Rejected', count: () => filteredByTab('rejected').length }
]

const filterOptions = [
    { id: 'all', label: 'Semua' },
    { id: 'prestasi', label: 'Prestasi' },
    { id: 'festival', label: 'Festival' }
]

// Get entries filtered by tab status
const filteredByTab = (status) => {
    let entries = []
    switch (status) {
        case 'pending': entries = entryStore.pendingEntries; break
        case 'approved': entries = entryStore.approvedEntries; break
        case 'rejected': entries = entryStore.rejectedEntries; break
        default: entries = entryStore.entries
    }
    
    if (activeFilter.value !== 'all') {
        entries = entries.filter(e => (e.athlete?.eventMode || e.category) === activeFilter.value)
    }
    
    return entries
}

const filteredEntries = computed(() => filteredByTab(activeTab.value))

// Group entries by team
const entriesByTeam = computed(() => {
    const groups = {}
    
    filteredEntries.value.forEach(entry => {
        const teamName = entry.teamName || 'Unknown Team'
        if (!groups[teamName]) {
            groups[teamName] = {
                teamName,
                entries: [],
                stats: {
                    total: 0,
                    prestasi: 0,
                    festival: 0,
                    kyorugi: 0,
                    poomsae: 0
                }
            }
        }
        groups[teamName].entries.push(entry)
        groups[teamName].stats.total++
        if (entry.athlete?.eventMode === 'prestasi' || entry.category?.includes('prestasi')) groups[teamName].stats.prestasi++
        if (entry.athlete?.eventMode === 'festival' || entry.category?.includes('festival')) groups[teamName].stats.festival++
        if (entry.athlete?.eventType === 'kyorugi' || entry.category?.toLowerCase().includes('kyorugi')) groups[teamName].stats.kyorugi++
        if (entry.athlete?.eventType === 'poomsae' || entry.category?.toLowerCase().includes('poomsae')) groups[teamName].stats.poomsae++
    })
    
    return Object.values(groups).sort((a, b) => b.stats.total - a.stats.total)
})

// Overall stats (ALL entries regardless of filter)
const allEntries = computed(() => entryStore.entries)
const overallStats = computed(() => {
    const entries = allEntries.value
    return {
        total: entries.length,
        prestasi: entries.filter(e => e.athlete?.eventMode === 'prestasi' || e.category?.includes('prestasi')).length,
        festival: entries.filter(e => e.athlete?.eventMode === 'festival' || e.category?.includes('festival')).length,
        kyorugi: entries.filter(e => e.athlete?.eventType === 'kyorugi' || e.category?.toLowerCase().includes('kyorugi')).length,
        poomsae: entries.filter(e => e.athlete?.eventType === 'poomsae' || e.category?.toLowerCase().includes('poomsae')).length,
        teams: new Set(entries.map(e => e.teamName)).size,
        pending: entryStore.pendingEntries.length,
        approved: entryStore.approvedEntries.length,
        rejected: entryStore.rejectedEntries.length
    }
})

// Category breakdown
const categoryBreakdown = computed(() => {
    const breakdown = {}
    filteredEntries.value.forEach(entry => {
        const cat = entry.athlete?.category || entry.category || 'other'
        if (!breakdown[cat]) {
            breakdown[cat] = { name: categoryNames?.[cat] || cat, count: 0 }
        }
        breakdown[cat].count++
    })
    return Object.values(breakdown).sort((a, b) => b.count - a.count)
})

const toggleTeam = (teamName) => {
    const idx = expandedTeams.value.indexOf(teamName)
    if (idx > -1) {
        expandedTeams.value.splice(idx, 1)
    } else {
        expandedTeams.value.push(teamName)
    }
}

const isTeamExpanded = (teamName) => expandedTeams.value.includes(teamName)

// Approve modal state
const showApproveModal = ref(false)
const approveNotes = ref('')

const openApproveModal = (entry) => {
    selectedEntry.value = entry
    approveNotes.value = ''
    showApproveModal.value = true
}

const confirmApprove = async () => {
    if (selectedEntry.value) {
        await entryStore.approveEntry(selectedEntry.value.id, authStore.currentUser.id, approveNotes.value)
        showApproveModal.value = false
        selectedEntry.value = null
        approveNotes.value = ''
    }
}

const approveAllTeam = (entries) => {
    if (confirm(`Approve semua ${entries.length} entry dari tim ini?`)) {
        entries.forEach(entry => {
            if (entry.status === 'pending') {
                entryStore.approveEntry(entry.id, authStore.currentUser.id, '')
            }
        })
    }
}

const openRejectModal = (entry) => {
    selectedEntry.value = entry
    rejectNotes.value = ''
    showRejectModal.value = true
}

const openDetailModal = (entry) => {
    selectedEntry.value = entry
    showDetailModal.value = true
}

const confirmReject = () => {
    if (selectedEntry.value) {
        entryStore.rejectEntry(selectedEntry.value.id, authStore.currentUser.id, rejectNotes.value)
        showRejectModal.value = false
        selectedEntry.value = null
    }
}

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID')
}

const getStatusBadge = (status) => {
    switch (status) {
        case 'pending': return { class: 'badge-warning', text: 'Pending' }
        case 'approved': return { class: 'badge-success', text: 'Approved' }
        case 'rejected': return { class: 'badge-error', text: 'Rejected' }
        default: return { class: 'badge-primary', text: status }
    }
}
</script>

<template>
    <div class="admin-entries">
        <div class="page-header">
            <h1>Entry Requests</h1>
            <p class="page-subtitle">Review dan approve entry atlet dari tim</p>
        </div>

        <!-- Stats Summary -->
        <div class="stats-summary">
            <div class="stat-item">
                <span class="stat-value">{{ overallStats.total }}</span>
                <span class="stat-label">Total Entry</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">{{ overallStats.teams }}</span>
                <span class="stat-label">Tim</span>
            </div>
            <div class="stat-item highlight-blue">
                <span class="stat-value">{{ overallStats.prestasi }}</span>
                <span class="stat-label">Prestasi</span>
            </div>
            <div class="stat-item highlight-orange">
                <span class="stat-value">{{ overallStats.festival }}</span>
                <span class="stat-label">Festival</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">{{ overallStats.kyorugi }}</span>
                <span class="stat-label">Kyorugi</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">{{ overallStats.poomsae }}</span>
                <span class="stat-label">Poomsae</span>
            </div>
        </div>

        <!-- Category Breakdown -->
        <div class="category-breakdown" v-if="categoryBreakdown.length > 0">
            <div v-for="cat in categoryBreakdown" :key="cat.name" class="cat-item">
                <span class="cat-name">{{ cat.name }}</span>
                <span class="cat-count">{{ cat.count }}</span>
            </div>
        </div>

        <!-- Tabs & Filters -->
        <div class="controls-row">
            <div class="tabs">
                <button 
                    v-for="tab in tabs" 
                    :key="tab.id"
                    class="tab-btn"
                    :class="{ active: activeTab === tab.id }"
                    @click="activeTab = tab.id"
                >
                    {{ tab.label }}
                    <span class="tab-count">{{ tab.count() }}</span>
                </button>
            </div>
            <div class="filters">
                <button 
                    v-for="f in filterOptions" 
                    :key="f.id"
                    class="filter-btn"
                    :class="{ active: activeFilter === f.id }"
                    @click="activeFilter = f.id"
                >
                    {{ f.label }}
                </button>
            </div>
        </div>

        <!-- Teams Accordion -->
        <div v-if="entriesByTeam.length === 0" class="empty-state card">
            <p>Tidak ada entry {{ activeTab }} {{ activeFilter !== 'all' ? `(${activeFilter})` : '' }}</p>
        </div>

        <div v-else class="teams-list">
            <div v-for="team in entriesByTeam" :key="team.teamName" class="team-card card">
                <div class="team-header" @click="toggleTeam(team.teamName)">
                    <div class="team-info">
                        <div class="team-avatar">{{ team.teamName.charAt(0) }}</div>
                        <div>
                            <h4 class="team-name">{{ team.teamName }}</h4>
                            <div class="team-stats">
                                <span>{{ team.stats.total }} atlet</span>
                                <span v-if="team.stats.prestasi">• {{ team.stats.prestasi }} Prestasi</span>
                                <span v-if="team.stats.festival">• {{ team.stats.festival }} Festival</span>
                            </div>
                        </div>
                    </div>
                    <div class="team-actions">
                        <button 
                            v-if="activeTab === 'pending' && team.entries.some(e => e.status === 'pending')"
                            @click.stop="approveAllTeam(team.entries)"
                            class="btn btn-primary btn-sm"
                        >
                            Approve All
                        </button>
                        <span class="expand-icon" :class="{ expanded: isTeamExpanded(team.teamName) }">▼</span>
                    </div>
                </div>
                
                <div v-if="isTeamExpanded(team.teamName)" class="team-entries">
                    <div v-for="entry in team.entries" :key="entry.id" class="entry-row" @click="openDetailModal(entry)">
                        <div class="entry-basic">
                            <div class="entry-photo" v-if="entry.athlete.photo">
                                <img :src="entry.athlete.photo" :alt="entry.athlete.fullName">
                            </div>
                            <div class="entry-avatar" v-else>{{ entry.athlete.fullName?.charAt(0) || 'A' }}</div>
                            <div class="entry-info">
                                <p class="entry-name">{{ entry.athlete.fullName }}</p>
                                <p class="entry-meta">
                                    {{ entry.athlete.categoryName || entry.athlete.category }} • 
                                    {{ entry.athlete.weightClass }} • 
                                    {{ entry.athlete.eventMode }} {{ entry.athlete.eventType }}
                                </p>
                            </div>
                        </div>
                        <div class="entry-details-row">
                            <span class="detail-tag">{{ entry.athlete.gender === 'male' ? 'Putra' : 'Putri' }}</span>
                            <span class="detail-tag">{{ entry.athlete.beltRankName || entry.athlete.beltRank }}</span>
                            <span class="detail-tag">{{ entry.athlete.height }}cm / {{ entry.athlete.weight }}kg</span>
                            <span v-if="entry.athlete.photo" class="detail-tag doc">📷</span>
                            <span v-if="entry.athlete.idDocumentName" class="detail-tag doc">📄</span>
                            <span v-if="entry.athlete.beltCertificateName" class="detail-tag doc">🥋</span>
                        </div>
                        <div class="entry-actions-row" @click.stop>
                            <span class="badge" :class="getStatusBadge(entry.status).class">
                                {{ getStatusBadge(entry.status).text }}
                            </span>
                            <div v-if="entry.status === 'pending'" class="action-btns">
                                <button @click="openApproveModal(entry)" class="btn btn-primary btn-xs">✓</button>
                                <button @click="openRejectModal(entry)" class="btn btn-danger btn-xs">✕</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Detail Modal -->
        <div v-if="showDetailModal && selectedEntry" class="modal-overlay" @click.self="showDetailModal = false">
            <div class="modal detail-modal">
                <div class="modal-header">
                    <h3>Detail Atlet</h3>
                    <button @click="showDetailModal = false" class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="detail-grid">
                        <div class="detail-photo-section">
                            <div class="detail-photo" v-if="selectedEntry.athlete.photo">
                                <img :src="selectedEntry.athlete.photo" :alt="selectedEntry.athlete.fullName">
                            </div>
                            <div class="detail-photo placeholder" v-else>
                                <span>{{ selectedEntry.athlete.fullName?.charAt(0) || 'A' }}</span>
                            </div>
                            <span class="badge large" :class="getStatusBadge(selectedEntry.status).class">
                                {{ getStatusBadge(selectedEntry.status).text }}
                            </span>
                        </div>
                        <div class="detail-info-section">
                            <h2 class="detail-name">{{ selectedEntry.athlete.fullName }}</h2>
                            <p class="detail-team">Tim: {{ selectedEntry.teamName }}</p>
                            
                            <!-- Labeled Tags -->
                            <div class="detail-tags-labeled">
                                <div class="tag-with-label">
                                    <span class="tag-label">Kategori Usia</span>
                                    <span class="tag tag-category">{{ selectedEntry.athlete.categoryName }}</span>
                                </div>
                                <div class="tag-with-label">
                                    <span class="tag-label">Kelas Tanding</span>
                                    <span class="tag tag-class">{{ selectedEntry.athlete.weightClass }}</span>
                                </div>
                                <div class="tag-with-label">
                                    <span class="tag-label">Mode</span>
                                    <span class="tag tag-event">{{ selectedEntry.athlete.eventMode }}</span>
                                </div>
                                <div class="tag-with-label">
                                    <span class="tag-label">Event</span>
                                    <span class="tag">{{ selectedEntry.athlete.eventType }}</span>
                                </div>
                            </div>
                            
                            <div class="detail-rows">
                                <div class="detail-row"><span class="label">Tempat, Tanggal Lahir</span><span class="value">{{ selectedEntry.athlete.birthPlace }}, {{ selectedEntry.athlete.birthDate }}</span></div>
                                <div class="detail-row"><span class="label">Usia (saat kompetisi)</span><span class="value">{{ selectedEntry.athlete.age }} tahun</span></div>
                                <div class="detail-row"><span class="label">Jenis Kelamin</span><span class="value">{{ selectedEntry.athlete.gender === 'male' ? 'Putra' : 'Putri' }}</span></div>
                                <div class="detail-row"><span class="label">Tinggi / Berat</span><span class="value">{{ selectedEntry.athlete.height }} cm / {{ selectedEntry.athlete.weight }} kg</span></div>
                                <div class="detail-row"><span class="label">Tingkatan Sabuk</span><span class="value">{{ selectedEntry.athlete.beltRankName || selectedEntry.athlete.beltRank }}</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- Document Previews (3-column grid) -->
                    <div class="document-previews-section">
                        <h4>📎 Dokumen Upload</h4>
                        <div class="doc-grid">
                            <!-- Foto 3x4 -->
                            <div class="doc-card">
                                <div class="doc-card-header">
                                    <span class="doc-icon">📷</span>
                                    <span class="doc-title">Foto 3x4</span>
                                </div>
                                <div class="doc-preview" v-if="selectedEntry.athlete?.photo">
                                    <img :src="selectedEntry.athlete.photo" alt="Foto 3x4" />
                                </div>
                                <div class="doc-empty" v-else>Belum ada foto</div>
                            </div>
                            
                            <!-- KTP / Akte -->
                            <div class="doc-card">
                                <div class="doc-card-header">
                                    <span class="doc-icon">📄</span>
                                    <span class="doc-title">KTP / Akte Lahir</span>
                                </div>
                                <div class="doc-preview" v-if="selectedEntry.athlete?.idDocument">
                                    <img :src="selectedEntry.athlete.idDocument" alt="KTP/Akte" v-if="!selectedEntry.athlete.idDocument.includes('pdf')" />
                                    <div class="doc-pdf" v-else>📁 File PDF</div>
                                </div>
                                <div class="doc-empty" v-else>Belum diupload</div>
                            </div>
                            
                            <!-- Sertifikat Sabuk -->
                            <div class="doc-card">
                                <div class="doc-card-header">
                                    <span class="doc-icon">🥋</span>
                                    <span class="doc-title">Sertifikat Sabuk</span>
                                </div>
                                <div class="doc-preview" v-if="selectedEntry.athlete?.beltCertificate">
                                    <img :src="selectedEntry.athlete.beltCertificate" alt="Sertifikat" v-if="!selectedEntry.athlete.beltCertificate.includes('pdf')" />
                                    <div class="doc-pdf" v-else>📁 File PDF</div>
                                </div>
                                <div class="doc-empty" v-else>Belum diupload</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div v-if="selectedEntry.status === 'pending'" class="action-btns-modal">
                        <button @click="showDetailModal = false; openApproveModal(selectedEntry)" class="btn btn-primary">Approve</button>
                        <button @click="showDetailModal = false; openRejectModal(selectedEntry)" class="btn btn-danger">Reject</button>
                    </div>
                    <button @click="showDetailModal = false" class="btn btn-secondary">Tutup</button>
                </div>
            </div>
        </div>

        <!-- Approve Modal -->
        <div v-if="showApproveModal && selectedEntry" class="modal-overlay" @click.self="showApproveModal = false">
            <div class="modal">
                <div class="modal-header">
                    <h3>Approve Entry</h3>
                    <button @click="showApproveModal = false" class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <p>Approve entry untuk <strong>{{ selectedEntry?.athlete?.fullName }}</strong>?</p>
                    <div class="form-group">
                        <label class="form-label">Catatan Admin (opsional)</label>
                        <textarea 
                            v-model="approveNotes" 
                            class="form-input" 
                            rows="3"
                            placeholder="Tambahkan catatan..."
                        ></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button @click="showApproveModal = false" class="btn btn-secondary">Batal</button>
                    <button @click="confirmApprove" class="btn btn-primary">Approve</button>
                </div>
            </div>
        </div>

        <!-- Reject Modal -->
        <div v-if="showRejectModal" class="modal-overlay" @click.self="showRejectModal = false">
            <div class="modal">
                <div class="modal-header">
                    <h3>Reject Entry</h3>
                    <button @click="showRejectModal = false" class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <p>Reject entry untuk <strong>{{ selectedEntry?.athlete?.fullName }}</strong>?</p>
                    <div class="form-group">
                        <label class="form-label">Catatan (opsional)</label>
                        <textarea 
                            v-model="rejectNotes" 
                            class="form-input" 
                            rows="3"
                            placeholder="Alasan penolakan..."
                        ></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button @click="showRejectModal = false" class="btn btn-secondary">Batal</button>
                    <button @click="confirmReject" class="btn btn-danger">Reject</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.admin-entries {
    max-width: 1200px;
    margin: 0 auto;
}

.page-header {
    margin-bottom: var(--space-4);
}

.page-header h1 {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-1);
}

.page-subtitle {
    color: var(--text-muted);
    font-size: var(--text-sm);
}

/* Stats Summary */
.stats-summary {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-4);
}

.stat-item {
    text-align: center;
    padding: var(--space-2) var(--space-4);
    min-width: 80px;
}

.stat-item.highlight-blue {
    background: rgba(59, 130, 246, 0.1);
    border-radius: var(--radius-md);
}

.stat-item.highlight-orange {
    background: rgba(230, 126, 34, 0.1);
    border-radius: var(--radius-md);
}

.stat-value {
    display: block;
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--primary);
}

.stat-item.highlight-blue .stat-value {
    color: #3B82F6;
}

.stat-item.highlight-orange .stat-value {
    color: var(--accent);
}

.stat-label {
    font-size: var(--text-xs);
    color: var(--text-muted);
}

/* Category Breakdown */
.category-breakdown {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
}

.cat-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
}

.cat-name {
    color: var(--text-muted);
}

.cat-count {
    font-weight: 600;
    color: var(--primary);
}

/* Controls */
.controls-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
    flex-wrap: wrap;
}

.tabs {
    display: flex;
    gap: var(--space-1);
    background: var(--bg-card);
    padding: var(--space-1);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--text-muted);
    font-weight: 500;
    font-size: var(--text-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
}

.tab-btn:hover {
    color: var(--text);
}

.tab-btn.active {
    background: var(--accent);
    color: #FFFFFF;
}

.tab-count {
    font-size: var(--text-xs);
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 6px;
    border-radius: var(--radius-full);
}

.filters {
    display: flex;
    gap: var(--space-1);
}

.filter-btn {
    padding: var(--space-2) var(--space-3);
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
}

.filter-btn:hover {
    border-color: var(--primary);
}

.filter-btn.active {
    background: var(--primary);
    border-color: var(--primary);
    color: #FFFFFF;
}

/* Teams List */
.teams-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
}

.team-card {
    padding: 0;
    overflow: hidden;
}

.team-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4);
    cursor: pointer;
    transition: background var(--transition-fast);
}

.team-header:hover {
    background: var(--bg-input);
}

.team-info {
    display: flex;
    align-items: center;
    gap: var(--space-3);
}

.team-avatar {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary);
    color: #FFFFFF;
    font-weight: 700;
    border-radius: var(--radius-md);
}

.team-name {
    margin-bottom: var(--space-1);
}

.team-stats {
    font-size: var(--text-xs);
    color: var(--text-muted);
}

.team-actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
}

.expand-icon {
    font-size: var(--text-xs);
    color: var(--text-muted);
    transition: transform var(--transition-fast);
}

.expand-icon.expanded {
    transform: rotate(180deg);
}

/* Team Entries */
.team-entries {
    border-top: 1px solid var(--border-color);
}

.entry-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: var(--space-3);
    align-items: center;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border-color);
}

.entry-row:last-child {
    border-bottom: none;
}

.entry-basic {
    display: flex;
    align-items: center;
    gap: var(--space-3);
}

.entry-avatar {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-input);
    color: var(--text);
    font-weight: 600;
    font-size: var(--text-sm);
    border-radius: var(--radius-md);
}

.entry-name {
    font-weight: 500;
    font-size: var(--text-sm);
}

.entry-meta {
    font-size: var(--text-xs);
    color: var(--text-muted);
}

.entry-details-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
}

.detail-tag {
    font-size: var(--text-xs);
    padding: 2px 6px;
    background: var(--bg-input);
    border-radius: var(--radius-sm);
    color: var(--text-muted);
}

.detail-tag.doc {
    background: rgba(16, 185, 129, 0.1);
}

.entry-actions-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
}

.action-btns {
    display: flex;
    gap: var(--space-1);
}

.btn-xs {
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
}

.empty-state {
    text-align: center;
    color: var(--text-muted);
    padding: var(--space-12);
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
    max-width: 400px;
    border: 1px solid var(--border-color);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4);
    border-bottom: 1px solid var(--border-color);
}

.modal-close {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-input);
    border: none;
    border-radius: var(--radius-md);
    color: var(--text);
    font-size: var(--text-lg);
    cursor: pointer;
}

.modal-body {
    padding: var(--space-4);
}

.modal-body p {
    margin-bottom: var(--space-4);
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    padding: var(--space-4);
    border-top: 1px solid var(--border-color);
}

@media (max-width: 768px) {
    .controls-row {
        flex-direction: column;
        align-items: stretch;
    }
    
    .entry-row {
        grid-template-columns: 1fr;
        gap: var(--space-2);
    }
    
    .entry-actions-row {
        justify-content: flex-end;
    }
    
    .stats-summary {
        justify-content: center;
    }
    
    .detail-grid {
        grid-template-columns: 1fr;
    }
}

/* Entry Photo */
.entry-photo {
    width: 40px;
    height: 52px;
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 2px solid var(--primary);
    flex-shrink: 0;
}

.entry-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.entry-row {
    cursor: pointer;
    transition: background var(--transition-fast);
}

.entry-row:hover {
    background: var(--bg-input);
}

/* Detail Modal */
.detail-modal {
    max-width: 680px;
    max-height: 90vh;
    overflow-y: auto;
}

.detail-grid {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: var(--space-5);
}

.detail-photo-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
}

.detail-photo {
    width: 130px;
    height: 170px;
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
    margin-bottom: var(--space-1);
}

.detail-team {
    color: var(--text-muted);
    font-size: var(--text-sm);
    margin-bottom: var(--space-3);
}

.detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
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
    font-size: var(--text-sm);
}

.detail-row .label {
    color: var(--text-muted);
}

.detail-row .value {
    font-weight: 500;
}

.detail-docs h4 {
    font-size: var(--text-sm);
    margin-bottom: var(--space-2);
    color: var(--text-muted);
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

.action-btns-modal {
    display: flex;
    gap: var(--space-2);
    margin-right: auto;
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
    color: var(--text-muted);
}

@media (max-width: 768px) {
    .doc-grid {
        grid-template-columns: 1fr;
    }
}

/* Legacy document previews */
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
</style>
