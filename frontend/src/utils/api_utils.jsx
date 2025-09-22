// import { getRefreshToken, storeToken, clearTokens } from "./auth_utils"

// Base API URL from environment variables for flexibility
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000'

const getCookie = (name) => {
    const m = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'))
    return m ? decodeURIComponent(m[2]) : null
  }
const toJson = async (res) => {
    let data = null
    try { data = await res.json() } catch {}
    return { success: res.ok, status: res.status, data }
}

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
            storeToken({
                access_token: data.access_token,
                refresh_token: data.refresh_token || refreshToken,
                user: data.user || JSON.parse(localStorage.getItem('user'))
            })
            return { success: true }
        }

        return { success: false, error: data.message || 'Token refresh failed' }

    } catch (error) {
        return { success: false, error: 'Network error during token refresh' }
    }
}



// GET request
export const apiGet = (endpoint, additionalOptions = {}) => {
    return MakeApiCalls(endpoint, { method: 'GET', ...additionalOptions })
}

// POST request with JSON body
export const apiPost = async (url, body) => {
    const csrf = getCookie('csrf_access_token')
    const res = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrf || ''
      },
      body: JSON.stringify(body || {})
    })
    return toJson(res)
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
export const apiDelete = async (url) => {
  const csrf = getCookie('csrf_access_token')
  const res = await fetch(`${API_URL}${url}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'X-CSRF-TOKEN': csrf || '' }
  })
  return toJson(res)
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