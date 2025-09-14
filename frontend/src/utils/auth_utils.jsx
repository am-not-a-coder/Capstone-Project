import { apiGet, apiPost } from "./api_utils"

let userCache = null

const readCache = () => {
    if (userCache) return userCache
    try {
        const raw = localStorage.getItem('user')
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}
    
const writeCache = (user) => {
    userCache = user
    if (user) {
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('LoggedIn', 'true')
    } else {
        localStorage.removeItem('user')
        localStorage.removeItem('LoggedIn')
    }
}

export const isLoggedIn = () => {
    const user = readCache()
    // Check if user exists and has required fields
    // JWT tokens are in HttpOnly cookies, so we rely on cached user data
    return !!(user && user.employeeID)
}

/**
 * Retrieves current user information from localStorage
 * @returns {Object|null} - User object or null if not found
 */
export const getCurrentUser = () => readCache()


export const fetchCurrentUser = async () => {
    const res = await apiGet('/api/me')
    if (res.success && res.data?.user) {
        writeCache(res.data.user)
        return res.data.user
    }
    writeCache(null)
    return null
}

export const cacheUserAfterLogin = async () => {
    return fetchCurrentUser()
}

export const logoutAcc = async () => {
    try {
        await apiPost('/api/logout')
    } catch (error) {
        console.error('Logout API error:', error)
    } finally {
        // Always clear cache regardless of API response
        writeCache(null)
        // Clear all storage
        localStorage.removeItem('user')
        localStorage.removeItem('LoggedIn')
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('LoggedIn')
        sessionStorage.removeItem('welcomeShown')
    }
}


export const updateCurrentUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser))
}
