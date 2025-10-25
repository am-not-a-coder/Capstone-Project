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

export const adminHelper = () => {
    const user = getCurrentUser()

    if (!user) {
        return false
    }

    return !!user?.isAdmin
}

export const coAdminHelper = () => {
    const user = getCurrentUser()

    if (!user) {
        return false
    }

    return !!user?.isCoAdmin
}

export const canRate = () => {
    const user = getCurrentUser()
    if (!user) return false
    return !!user?.isAdmin || !!user?.isRating
}

export const canEditUsers = () => {
    const user = getCurrentUser()
    if (!user) return false
    return !!user?.isAdmin || !!user?.isCoAdmin || !!user?.isEdit
}

export const canManageForms = () => {
    const user = getCurrentUser()
    if (!user) return false
    return !!user?.isAdmin || !!user?.crudFormsEnable
}

export const canManagePrograms = () => {
    const user = getCurrentUser()
    if (!user) return false
    return !!user?.isAdmin || !!user?.crudProgramEnable
}

export const canManageInstitutes = () => {
    const user = getCurrentUser()
    if (!user) return false
    return !!user?.isAdmin || !!user?.crudInstituteEnable
}

export const hasAdminPrivileges = () => {
    const user = getCurrentUser()
    if (!user) return false
    return !!user?.isAdmin || !!user?.isCoAdmin
}

export const PermissionGate = ({ requires, children }) => {
    const user = getCurrentUser() 
    if (!user) return null  

    if (user.isAdmin === true) {
        return children
    }

    if (user[requires]) {   
        return children  
    }

    return null  
}