import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { entriesApi } from '../services/api'

export const useEntryStore = defineStore('entry', () => {
    // State
    const entries = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    // Computed
    const draftEntries = computed(() =>
        entries.value.filter(e => e.status === 'draft')
    )

    const pendingEntries = computed(() =>
        entries.value.filter(e => e.status === 'pending')
    )

    const approvedEntries = computed(() =>
        entries.value.filter(e => e.status === 'approved')
    )

    const rejectedEntries = computed(() =>
        entries.value.filter(e => e.status === 'rejected')
    )

    // Load entries from API
    const loadEntries = async (status = null) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await entriesApi.getAll(status)
            entries.value = response.entries
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Get entries by user
    const getEntriesByUser = (userId) => {
        return entries.value.filter(e => e.userId === userId)
    }

    // Add new entry
    const addEntry = async (entryData) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await entriesApi.create(entryData)
            entries.value.unshift(response.entry)
            return response
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Update entry
    const updateEntry = async (entryId, updates) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await entriesApi.update(entryId, updates)
            const index = entries.value.findIndex(e => e.id === entryId)
            if (index !== -1) {
                entries.value[index] = response.entry
            }
            return response.entry
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Delete entry
    const deleteEntry = async (entryId) => {
        isLoading.value = true
        error.value = null

        try {
            await entriesApi.delete(entryId)
            entries.value = entries.value.filter(e => e.id !== entryId)
            return true
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Approve entry (admin)
    const approveEntry = async (entryId, notes = '') => {
        isLoading.value = true
        error.value = null

        try {
            const response = await entriesApi.approve(entryId, notes)
            const index = entries.value.findIndex(e => e.id === entryId)
            if (index !== -1) {
                entries.value[index] = response.entry
            }
            return response
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Reject entry (admin)
    const rejectEntry = async (entryId, notes = '') => {
        isLoading.value = true
        error.value = null

        try {
            const response = await entriesApi.reject(entryId, notes)
            const index = entries.value.findIndex(e => e.id === entryId)
            if (index !== -1) {
                entries.value[index] = response.entry
            }
            return response
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Bulk approve
    const bulkApprove = async (entryIds) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await entriesApi.bulkApprove(entryIds)
            // Reload entries to get updated status
            await loadEntries()
            return response
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Get stats (admin)
    const getStats = async () => {
        try {
            return await entriesApi.getStats()
        } catch (e) {
            error.value = e.message
            throw e
        }
    }

    // Submit all drafts to admin
    const submitDrafts = async () => {
        isLoading.value = true
        error.value = null

        try {
            const response = await entriesApi.submitDrafts()
            // Reload entries to get updated status
            await loadEntries()
            return response
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    return {
        entries,
        isLoading,
        error,
        draftEntries,
        pendingEntries,
        approvedEntries,
        rejectedEntries,
        getEntriesByUser,
        loadEntries,
        addEntry,
        updateEntry,
        deleteEntry,
        approveEntry,
        rejectEntry,
        bulkApprove,
        getStats,
        submitDrafts
    }
})
