// Base API URL from environment variables for flexibility
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000'

export const MakeApiCalls = async (endpoint, options = {}) => {
    // Combine base URL with endpoint
    const fullUrl = `${API_URL}${endpoint}`

    // Default headers (don't set Content-Type for FormData)
    const defaultHeaders = {}

    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json'
    }

    // Merge provided options with our defaults
    const finalOptions = {
        ...options,
        credentials: 'include',
        headers: {
            ...defaultHeaders,
            ...options.headers // Allow overriding default headers
        }
    }

    try {
        const response = await fetch(fullUrl, finalOptions)
        
        // Handle blob responses (for file downloads)
        if (options.responseType === 'blob') {
            if (response.ok) {
                const blob = await response.blob()
                return {
                    success: true,
                    data: blob,
                    status: response.status,
                    headers: response.headers
                }
            }
            
            // For error responses with blob type, try to parse as JSON first
            let errorData
            try {
                errorData = await response.json()
            } catch {
                errorData = { message: `HTTP ${response.status}: ${response.statusText}` }
            }
            
            // Handle authentication failures for blob requests
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

                clearTokens()
                window.location.href = '/login'
                return {
                    success: false,
                    error: 'Authentication expired. Please login again.',
                    status: 401
                }
            }
            
            return {
                success: false,
                error: errorData.message || errorData.error || 'Request failed',
                data: errorData,
                status: response.status
            }
        }

        // Regular JSON response handling
        const data = await response.json()

            if (response.ok) {
                return { success: true, data, status: response.status}
            }

            return {
                success: false,
                error: data.message || data.error || 'Request failed',
                data,
                status: response.status
            }
    }catch(error) {
        return { success: false, error: 'Network error. Please check your connection.'}
    }

}



// GET request
export const apiGet = (endpoint, additionalOptions = {}) => {
    return MakeApiCalls(endpoint, { method: 'GET', ...additionalOptions })
}

// POST request with JSON body
export const apiPost = (endpoint, data = {}, additionalOptions = {}) => {
    return MakeApiCalls(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
        ...additionalOptions
    })
}

// PUT request with JSON body
export const apiPut = (endpoint, data = {}, additionalOptions = {}) => {
    return MakeApiCalls(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...additionalOptions
    })
}

// DELETE request
export const apiDelete = (endpoint, additionalOptions = {}) => {
    return MakeApiCalls(endpoint, { method: 'DELETE', ...additionalOptions })
}

// POST request with FormData (e.g. file uploads)
export const apiPostForm = (endpoint, formData, additionalOptions = {}) => {
    return MakeApiCalls(endpoint, {
        method: 'POST',
        body: formData,
        ...additionalOptions
    })
}

// GET request for blob/file downloads
export const apiGetBlob = (endpoint, additionalOptions = {}) => {
    return MakeApiCalls(endpoint, { 
        method: 'GET', 
        responseType: 'blob',
        ...additionalOptions 
    })
}