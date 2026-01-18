import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const THEME_KEY = 'ugmtc_theme'

export const useThemeStore = defineStore('theme', () => {
    // Get initial theme from localStorage or system preference
    const getInitialTheme = () => {
        const saved = localStorage.getItem(THEME_KEY)
        if (saved) return saved

        // Check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark'
        }
        return 'light'
    }

    const theme = ref(getInitialTheme())
    const isDark = ref(theme.value === 'dark')

    // Apply theme to document
    const applyTheme = (newTheme) => {
        document.documentElement.setAttribute('data-theme', newTheme)
        localStorage.setItem(THEME_KEY, newTheme)
    }

    // Toggle theme
    const toggleTheme = () => {
        theme.value = theme.value === 'dark' ? 'light' : 'dark'
        isDark.value = theme.value === 'dark'
        applyTheme(theme.value)
    }

    // Set specific theme
    const setTheme = (newTheme) => {
        theme.value = newTheme
        isDark.value = newTheme === 'dark'
        applyTheme(newTheme)
    }

    // Initialize theme on store creation
    applyTheme(theme.value)

    // Watch for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
            setTheme(e.matches ? 'dark' : 'light')
        }
    })

    return {
        theme,
        isDark,
        toggleTheme,
        setTheme
    }
})
