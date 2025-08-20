import { apiGet, apiPost } from "./api_utils"

let userCache = null

const readCache = () => {
    if (userCache) return userCache
    try {
        const raw = sessionStorage.getItem('user')
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}
    
const writeCache = (user) => {
    userCache = user
    if (user) {
        sessionStorage.setItem('user', JSON.stringify(user))
    } else {
        sessionStorage.removeItem('user')
    }
}

export const isLoggedIn = () => {
    const token = readCache()
    return token !== null && token?.employeeID
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
    await apiPost('/api/logout')
    writeCache(null)
}


export const updateCurrentUser = (updatedUser) => {
    sessionStorage.setItem('user', JSON.stringify(updatedUser))
}
