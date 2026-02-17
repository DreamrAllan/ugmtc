// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const TOKEN_KEY = 'ugmtc_token'

// Get stored token
export const getToken = () => localStorage.getItem(TOKEN_KEY)

// Set token
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)

// Remove token
export const removeToken = () => localStorage.removeItem(TOKEN_KEY)

// API request helper
export const apiRequest = async (endpoint, options = {}) => {
    const token = getToken()

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.error || 'Request failed')
    }

    return data
}

// Auth API
export const authApi = {
    register: (userData) => apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),

    login: (email, password) => apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    }),

    logout: () => apiRequest('/auth/logout', { method: 'POST' }),

    me: () => apiRequest('/auth/me'),

    verifyEmail: (token) => apiRequest('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token })
    }),

    resendVerification: () => apiRequest('/auth/resend-verification', {
        method: 'POST'
    }),

    forgotPassword: (email) => apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
    }),

    resetPassword: (token, password) => apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
    })
}

// Users API (admin)
export const usersApi = {
    getAll: () => apiRequest('/users'),

    updateRole: (userId, role) => apiRequest(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
    }),

    delete: (userId) => apiRequest(`/users/${userId}`, {
        method: 'DELETE'
    })
}

// Athletes API
export const athletesApi = {
    getAll: () => apiRequest('/athletes'),

    // Use FormData for file uploads
    create: async (athleteData, files = {}) => {
        const token = getToken()
        const formData = new FormData()

        // Add text fields
        Object.keys(athleteData).forEach(key => {
            if (athleteData[key] !== null && athleteData[key] !== undefined) {
                formData.append(key, athleteData[key])
            }
        })

        // Add files
        if (files.photo) formData.append('photo', files.photo)
        if (files.idDocument) formData.append('idDocument', files.idDocument)
        if (files.healthCertificate) formData.append('healthCertificate', files.healthCertificate)
        if (files.beltCertificate) formData.append('beltCertificate', files.beltCertificate)

        const response = await fetch(`${API_BASE_URL}/athletes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })

        const data = await response.json()
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create athlete')
        }
        return data
    },

    update: (athleteId, athleteData) => apiRequest(`/athletes/${athleteId}`, {
        method: 'PUT',
        body: JSON.stringify(athleteData)
    }),

    delete: (athleteId) => apiRequest(`/athletes/${athleteId}`, {
        method: 'DELETE'
    }),

    bulkCreate: (athletes) => apiRequest('/athletes/bulk', {
        method: 'POST',
        body: JSON.stringify({ athletes })
    }),

    downloadTemplate: async () => {
        const token = getToken()
        const response = await fetch(`${API_BASE_URL}/athletes/template`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!response.ok) throw new Error('Failed to download template')
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'Template_Data_Atlet_UGMTC.xlsx'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    },

    importExcel: async (file) => {
        const token = getToken()
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_BASE_URL}/athletes/import-excel`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })

        const data = await response.json()
        if (!response.ok) {
            const err = new Error(data.error || 'Failed to import')
            err.errors = data.errors
            throw err
        }
        return data
    },

    uploadDocuments: async (athleteId, files) => {
        const token = getToken()
        const formData = new FormData()

        if (files.photo) formData.append('photo', files.photo)
        if (files.idDocument) formData.append('idDocument', files.idDocument)
        if (files.beltCertificate) formData.append('beltCertificate', files.beltCertificate)
        if (files.healthCertificate) formData.append('healthCertificate', files.healthCertificate)

        const response = await fetch(`${API_BASE_URL}/athletes/${athleteId}/documents`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })

        const data = await response.json()
        if (!response.ok) {
            throw new Error(data.error || 'Failed to upload documents')
        }
        return data
    },

    submitDrafts: () => apiRequest('/athletes/submit-drafts', {
        method: 'POST'
    }),

    updateAthlete: async (athleteId, formData) => {
        const token = getToken()
        const response = await fetch(`${API_BASE_URL}/athletes/${athleteId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })
        const data = await response.json()
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update athlete')
        }
        return data
    }
}

// Entries API
export const entriesApi = {
    getAll: (status) => apiRequest(`/entries${status ? `?status=${status}` : ''}`),

    getStats: () => apiRequest('/entries/stats'),

    create: (entryData) => apiRequest('/entries', {
        method: 'POST',
        body: JSON.stringify(entryData)
    }),

    update: (entryId, entryData) => apiRequest(`/entries/${entryId}`, {
        method: 'PATCH',
        body: JSON.stringify(entryData)
    }),

    delete: (entryId) => apiRequest(`/entries/${entryId}`, {
        method: 'DELETE'
    }),

    submitDrafts: () => apiRequest('/entries/submit-drafts', {
        method: 'POST',
        body: JSON.stringify({})
    }),

    approve: (entryId, notes) => apiRequest(`/entries/${entryId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ notes })
    }),

    reject: (entryId, notes) => apiRequest(`/entries/${entryId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ notes })
    }),

    bulkApprove: (entryIds) => apiRequest('/entries/bulk-approve', {
        method: 'POST',
        body: JSON.stringify({ entryIds })
    })
}

// Helper for FormData requests (file uploads)
const apiRequestFormData = async (endpoint, formData) => {
    const token = getToken()

    const headers = {}
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.error || 'Request failed')
    }

    return data
}

// Team API
export const teamApi = {
    getProfile: () => apiRequest('/team'),

    updateProfile: (data) => apiRequest('/team', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    uploadLogo: (file) => {
        const formData = new FormData()
        formData.append('logo', file)
        return apiRequestFormData('/team/logo', formData)
    },

    getStatus: () => apiRequest('/team/status'),

    addCoach: (data) => apiRequest('/team/coaches', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    updateCoach: (coachId, data) => apiRequest(`/team/coaches/${coachId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    }),

    removeCoach: (coachId) => apiRequest(`/team/coaches/${coachId}`, {
        method: 'DELETE'
    })
}

// Get base URL for images
export const getImageUrl = (path) => {
    if (!path) return null
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'
    return `${baseUrl}${path}`
}
