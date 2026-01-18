import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useRegistrationStore = defineStore('registration', () => {
    // Current step
    const currentStep = ref(1)

    // Coach/Team data
    const coach = ref({
        name: '',
        phone: '',
        email: '',
        ktpFile: null,
        teamName: '',
        teamPhoto: null
    })

    // Athletes list
    const athletes = ref([])

    // Registration entries (athlete + category)
    const registrations = ref([])

    // Computed
    const totalAthletes = computed(() => athletes.value.length)

    const teamFee = computed(() => 100000)

    const athleteFee = computed(() => {
        // Count unique athletes with at least one registration
        const registeredAthletes = new Set(registrations.value.map(r => r.athleteId))
        return registeredAthletes.size * 500000
    })

    const totalFee = computed(() => teamFee.value + athleteFee.value)

    // Actions
    const setCoach = (data) => {
        coach.value = { ...coach.value, ...data }
    }

    const addAthlete = (athlete) => {
        const id = Date.now().toString()
        athletes.value.push({
            id,
            ...athlete,
            createdAt: new Date()
        })
        return id
    }

    const updateAthlete = (id, data) => {
        const index = athletes.value.findIndex(a => a.id === id)
        if (index !== -1) {
            athletes.value[index] = { ...athletes.value[index], ...data }
        }
    }

    const removeAthlete = (id) => {
        athletes.value = athletes.value.filter(a => a.id !== id)
        // Also remove registrations for this athlete
        registrations.value = registrations.value.filter(r => r.athleteId !== id)
    }

    const addBulkAthletes = (athleteList) => {
        athleteList.forEach(athlete => {
            addAthlete(athlete)
        })
    }

    const addRegistration = (athleteId, category) => {
        const id = Date.now().toString()
        registrations.value.push({
            id,
            athleteId,
            ...category
        })
        return id
    }

    const removeRegistration = (id) => {
        registrations.value = registrations.value.filter(r => r.id !== id)
    }

    const nextStep = () => {
        if (currentStep.value < 4) {
            currentStep.value++
        }
    }

    const prevStep = () => {
        if (currentStep.value > 1) {
            currentStep.value--
        }
    }

    const goToStep = (step) => {
        if (step >= 1 && step <= 4) {
            currentStep.value = step
        }
    }

    const reset = () => {
        currentStep.value = 1
        coach.value = {
            name: '',
            phone: '',
            email: '',
            ktpFile: null,
            teamName: '',
            teamPhoto: null
        }
        athletes.value = []
        registrations.value = []
    }

    return {
        currentStep,
        coach,
        athletes,
        registrations,
        totalAthletes,
        teamFee,
        athleteFee,
        totalFee,
        setCoach,
        addAthlete,
        updateAthlete,
        removeAthlete,
        addBulkAthletes,
        addRegistration,
        removeRegistration,
        nextStep,
        prevStep,
        goToStep,
        reset
    }
})
