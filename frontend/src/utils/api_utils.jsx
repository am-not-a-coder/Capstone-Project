import { getAccessToken, getRefreshToken, storeToken, clearTokens } from "./auth_utils"

// Base API URL from environment variables for flexibility
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000'

export const MakeApiCalls = async (endpoint, options = {}) => {
    //combine base URL with endpoint
    const fullUrl = `${API_URL}${endpoint}`
    
    // Get current access token for authentication
    const accessToken = getAccessToken()
    
    const defaultHeaders = {}
    
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json'
    }
    
    // Add authorization header if token exists
    if (accessToken) {
        defaultHeaders['Authorization'] = `Bearer ${accessToken}`
    }
    
    // Merge provided options with our defaults
    const finalOptions = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers // Allow overriding default headers
        }
    }
    

    
    try {
        // Make the actual HTTP request
        const response = await fetch(fullUrl, finalOptions)
        
        const data = await response.json()
        
        // Handle responses
        if (response.ok) {
            return {
                success: true,
                data: data,
                status: response.status
            }
        }
        
        // Handle authentication failures 
        if (response.status === 401) {
            
            const refreshToken = getRefreshToken()
            
            if (refreshToken && endpoint !== '/api/refresh-token') {
                
                try {
                    const refreshResult = await refreshAccessToken()
                    if (refreshResult.success) {
                        // Retry original request with new token
                        return MakeApiCalls(endpoint, options)
                    }
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError)
                }
            }
            
            // If refresh fails or no refresh token, logout user
            clearTokens()
            window.location.href = '/login'
            return {
                success: false,
                error: 'Authentication expired. Please login again.',
                status: 401
            }
        }
        
        // Handle other HTTP errors
        return {
            success: false,
            error: data.message || data.error || 'Request failed',
            data: data,
            status: response.status
        }
        
    } catch (error) {
        
        console.error('API call failed:', error)
        return {
            success: false,
            error: 'Network error. Please check your connection.',
            status: 0
        }
    }
}


const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken()
    
    if (!refreshToken) {
        return { success: false, error: 'No refresh token available' }
    }
    
    try {
        const response = await fetch(`${API_URL}/api/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshToken}`
            }
        })
        
        const data = await response.json()
        
        if (response.ok && data.access_token) {
            // Store new tokens 
            storeToken({
                access_token: data.access_token,
                refresh_token: data.refresh_token || refreshToken, // Use new or keep old
                user: data.user || JSON.parse(localStorage.getItem('user')) // Keep user data
            })
            
            return { success: true }
        }
        
        return { success: false, error: data.message || 'Token refresh failed' }
        
    } catch (error) {
        return { success: false, error: 'Network error during token refresh' }
    }
}

//Usage: const users = await apiGet('/api/users')
export const apiGet = (endpoint, additionalOptions = {}) => {
    return MakeApiCalls(endpoint, {
        method: 'GET',
        ...additionalOptions
    })
}


 //Usage: const result = await apiPost('/api/users', { name: 'John' })

export const apiPost = (endpoint, data = {}, additionalOptions = {}) => {
    return MakeApiCalls(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
        ...additionalOptions
    })
}

export const apiPut = (endpoint, data = {}, additionalOptions = {}) => {
    return MakeApiCalls(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...additionalOptions
    })
}

export const apiDelete = (endpoint, additionalOptions = {}) => {
    return MakeApiCalls(endpoint, {
        method: 'DELETE',
        ...additionalOptions
    })
}

export const apiPostForm = (endpoint, formData, additionalOptions = {}) => {
    return MakeApiCalls(endpoint, {
        method: 'POST',
        body: formData,
        ...additionalOptions
    })
}
