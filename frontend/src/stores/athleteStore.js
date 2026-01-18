import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { athletesApi } from '../services/api'

export const useAthleteStore = defineStore('athlete', () => {
    // State
    const athletes = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    // Computed
    const totalAthletes = computed(() => athletes.value.length)

    // Load athletes from API
    const loadAthletes = async () => {
        isLoading.value = true
        error.value = null

        try {
            const response = await athletesApi.getAll()
            athletes.value = response.athletes
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Add athlete
    const addAthlete = async (athleteData) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await athletesApi.create(athleteData)
            athletes.value.unshift(response.athlete)
            return response.athlete
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Update athlete
    const updateAthlete = async (athleteId, updates) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await athletesApi.update(athleteId, updates)
            const index = athletes.value.findIndex(a => a.id === athleteId)
            if (index !== -1) {
                athletes.value[index] = response.athlete
            }
            return response.athlete
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Remove athlete
    const removeAthlete = async (athleteId) => {
        isLoading.value = true
        error.value = null

        try {
            await athletesApi.delete(athleteId)
            athletes.value = athletes.value.filter(a => a.id !== athleteId)
            return true
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Bulk add athletes
    const addBulkAthletes = async (athleteList) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await athletesApi.bulkCreate(athleteList)
            // Reload to get all athletes with proper IDs
            await loadAthletes()
            return response
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Get athlete by ID
    const getAthleteById = (id) => {
        return athletes.value.find(a => a.id === id)
    }

    return {
        athletes,
        isLoading,
        error,
        totalAthletes,
        loadAthletes,
        addAthlete,
        updateAthlete,
        removeAthlete,
        addBulkAthletes,
        getAthleteById
    }
})
