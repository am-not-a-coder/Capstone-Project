
/**
 * Stores authentication data in localStorage
 * @param {Object} data - Object containing access_token, refresh_token, and user info
 */
export const storeToken = (data) => {
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('user', JSON.stringify(data.user))
}

/**
 * Generic token retrieval function
 * @param {string} tokenType - Type of token to retrieve ('access_token', 'refresh_token')
 * @returns {string|null} - The token or null if not found
 */
export const getToken = (tokenType) => {
    return localStorage.getItem(tokenType)
}

export const getAccessToken = () => {
    return getToken('access_token')
}

export const getRefreshToken = () => {
    return getToken('refresh_token')
}

/**
 * Checks if user is currently logged in
 * @returns {boolean} - True if user has valid access token
 */
export const isLoggedIn = () => {
    const token = getAccessToken()
    return token !== null && token !== undefined && token.length > 0
}

/**
 * Retrieves current user information from localStorage
 * @returns {Object|null} - User object or null if not found
 */
export const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('user')
        return userStr ? JSON.parse(userStr) : null
    } catch (error) {
        console.error('Error parsing user data:', error)
        return null
    }
}

/**
 * Clears all authentication data from localStorage
 * This is used during logout or when tokens become invalid
 */
export const clearTokens = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
}

/**
 * Updates user information in localStorage
 * @param {Object} updatedUser - New user data to store
 */
export const updateCurrentUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser))
}
