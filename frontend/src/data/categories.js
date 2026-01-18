// UGMTC 2026 Category & Weight Class Data
// Auto-calculated based on birth date

// Event reference date (competition date)
export const COMPETITION_DATE = new Date('2026-06-01')

// Calculate age on competition date
export const calculateAge = (birthDate) => {
    const birth = new Date(birthDate)
    const comp = COMPETITION_DATE
    let age = comp.getFullYear() - birth.getFullYear()
    const monthDiff = comp.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && comp.getDate() < birth.getDate())) {
        age--
    }
    return age
}

// Get age category based on birth date
export const getAgeCategory = (birthDate, eventMode = 'prestasi') => {
    const age = calculateAge(birthDate)

    if (eventMode === 'prestasi') {
        // Prestasi categories
        if (age >= 10 && age <= 11) return 'pra-cadet'
        if (age >= 12 && age <= 14) return 'cadet'
        if (age >= 15 && age <= 17) return 'junior'
        if (age >= 18) return 'senior'
    } else {
        // Festival categories
        if (age >= 7 && age <= 8) return 'pra-cadet-a'
        if (age >= 9 && age <= 11) return 'pra-cadet-b'
        if (age >= 12 && age <= 14) return 'cadet'
        if (age >= 15 && age <= 17) return 'junior'
        if (age >= 18) return 'senior'
    }

    return null // Age not eligible
}

// Category display names
export const categoryNames = {
    'pra-cadet': 'Pra-Cadet',
    'pra-cadet-a': 'Pra-Cadet A',
    'pra-cadet-b': 'Pra-Cadet B',
    'cadet': 'Cadet',
    'junior': 'Junior',
    'senior': 'Senior'
}

// Weight classes for Prestasi Kyorugi
export const prestasiWeightClasses = {
    'pra-cadet': {
        male: ['U-20', 'U-22', 'U-24', 'U-26', 'U-28', 'U-30', 'U-33', 'U-42'],
        female: ['U-22', 'U-24', 'U-26', 'U-28', 'U-30', 'U-33', 'U-36', 'U-39', 'U-42']
    },
    'cadet': {
        male: ['U-33', 'U-37', 'U-41', 'U-45', 'U-49', 'U-53', 'U-57', 'U-61', 'U-65', 'Over 65'],
        female: ['U-33', 'U-37', 'U-41', 'U-44', 'U-47', 'U-51', 'U-55', 'U-59', 'Over 59']
    },
    'junior': {
        male: ['U-45', 'U-48', 'U-51', 'U-55', 'U-59', 'U-63', 'U-68', 'U-73', 'Over 78'],
        female: ['U-42', 'U-44', 'U-46', 'U-49', 'U-52', 'U-55', 'U-59', 'U-63', 'U-68']
    },
    'senior': {
        male: ['U-54', 'U-58', 'U-63', 'U-68', 'U-74', 'U-80', 'U-87', 'Over 87'],
        female: ['U-46', 'U-49', 'U-53', 'U-57', 'U-62', 'U-67', 'U-73', 'Over 73']
    }
}

// Weight classes for Festival Kyorugi
export const festivalWeightClasses = {
    'pra-cadet-a': {
        male: ['U-18', 'U-20', 'U-22', 'U-24', 'U-26', 'U-28', 'U-30', 'U-33', 'U-40', 'U-45', 'Over 45'],
        female: ['U-18', 'U-20', 'U-22', 'U-24', 'U-26', 'U-28', 'U-39']
    },
    'pra-cadet-b': {
        male: ['U-20', 'U-22', 'U-23', 'U-24', 'U-26', 'U-28', 'U-30', 'U-33', 'U-36', 'U-39', 'U-42', 'U-45', 'Over 45'],
        female: ['U-20', 'U-22', 'U-24', 'U-26', 'U-28', 'U-30', 'U-33', 'U-36', 'U-39', 'U-42', 'U-45', 'Over 45']
    },
    'cadet': {
        male: ['U-33', 'U-37', 'U-41', 'U-45', 'U-49', 'U-53', 'U-57', 'U-61', 'U-65', 'Over 65'],
        female: ['U-29', 'U-33', 'U-35', 'U-37', 'U-41', 'U-44', 'U-47', 'U-51', 'U-55', 'U-59', 'Over 59']
    },
    'junior': {
        male: ['U-45', 'U-48', 'U-51', 'U-55', 'U-59', 'U-63', 'U-68', 'U-73', 'U-78', 'Over 78'],
        female: ['U-41', 'U-42', 'U-44', 'U-46', 'U-49', 'U-52', 'U-55', 'U-59', 'U-63', 'U-68']
    },
    'senior': {
        male: ['U-54', 'U-58', 'U-63', 'U-68', 'U-74', 'U-80', 'U-87', 'Over 87'],
        female: ['U-46', 'U-49', 'U-53', 'U-57', 'U-62', 'U-67', 'U-73', 'Over 73']
    }
}

// Get weight classes based on category, gender, and mode
export const getWeightClasses = (category, gender, eventMode = 'prestasi') => {
    const classes = eventMode === 'prestasi' ? prestasiWeightClasses : festivalWeightClasses
    const genderKey = gender === 'male' ? 'male' : 'female'

    if (classes[category] && classes[category][genderKey]) {
        return classes[category][genderKey]
    }
    return []
}

// Event modes
export const eventModes = [
    { id: 'prestasi', name: 'Prestasi' },
    { id: 'festival', name: 'Festival' }
]

// Event types
export const eventTypes = [
    { id: 'kyorugi', name: 'Kyorugi' },
    { id: 'poomsae', name: 'Poomsae' }
]

// Belt ranks (Geup and Dan)
export const beltRanks = [
    { id: 'geup-10', name: '10 Geup (Putih)', level: 10, type: 'geup' },
    { id: 'geup-9', name: '9 Geup (Putih Strip Kuning)', level: 9, type: 'geup' },
    { id: 'geup-8', name: '8 Geup (Kuning)', level: 8, type: 'geup' },
    { id: 'geup-7', name: '7 Geup (Kuning Strip Hijau)', level: 7, type: 'geup' },
    { id: 'geup-6', name: '6 Geup (Hijau)', level: 6, type: 'geup' },
    { id: 'geup-5', name: '5 Geup (Hijau Strip Biru)', level: 5, type: 'geup' },
    { id: 'geup-4', name: '4 Geup (Biru)', level: 4, type: 'geup' },
    { id: 'geup-3', name: '3 Geup (Biru Strip Merah)', level: 3, type: 'geup' },
    { id: 'geup-2', name: '2 Geup (Merah)', level: 2, type: 'geup' },
    { id: 'geup-1', name: '1 Geup (Merah Strip Hitam)', level: 1, type: 'geup' },
    { id: 'poom-1', name: '1 Poom', level: 1, type: 'poom' },
    { id: 'poom-2', name: '2 Poom', level: 2, type: 'poom' },
    { id: 'poom-3', name: '3 Poom', level: 3, type: 'poom' },
    { id: 'dan-1', name: '1 Dan', level: 1, type: 'dan' },
    { id: 'dan-2', name: '2 Dan', level: 2, type: 'dan' },
    { id: 'dan-3', name: '3 Dan', level: 3, type: 'dan' },
    { id: 'dan-4', name: '4 Dan', level: 4, type: 'dan' },
    { id: 'dan-5', name: '5 Dan', level: 5, type: 'dan' },
    { id: 'dan-6', name: '6 Dan', level: 6, type: 'dan' },
    { id: 'dan-7', name: '7 Dan', level: 7, type: 'dan' },
    { id: 'dan-8', name: '8 Dan', level: 8, type: 'dan' },
    { id: 'dan-9', name: '9 Dan', level: 9, type: 'dan' }
]
