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
            ...(options.headers || {}) // Allow overriding default headers
        }
    }

    try {
        const response = await fetch(fullUrl, finalOptions)
        
        // Handle 401 Unauthorized - try to refresh token once
        if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/refresh-token')) {
            try {
                const refreshResponse = await fetch(`${API_URL}/api/refresh-token`, {
                    method: 'POST',
                    credentials: 'include'
                })
                if (refreshResponse.ok) {
                    return await fetch(fullUrl, finalOptions)
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError)
            }
            window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'error', msg: 'Session expired. Please login again.' } }))
            window.location.href = '/login'
            return { success: false, status: 401, data: { message: 'Session expired' } }
        }

        // Handle 403 Forbidden - do not redirect; show clear toast
        if (response.status === 403) {
            let data = null
            try { data = await response.json() } catch {}
            const msg = (data && (data.message || data.error)) || 'You do not have permission to perform this action.'
            window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'error', msg } }))
            return { success: false, status: 403, error: msg, data }
        }

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
    
    // Error Handling for non-JSON responses
    let errorData
    try {
       
        const errorText = await response.text()
        
        // Try to parse as JSON, but fallback to text
        try {
            errorData = JSON.parse(errorText)
        } catch {
            errorData = { 
                message: errorText || `HTTP ${response.status}: ${response.statusText}`,
                status: response.status 
            }
        }
    } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` }
    }
    
    if (response.status === 401) {
        const refreshToken = getRefreshToken()
        if (refreshToken && endpoint !== '/api/refresh-token') {
            try {
                const refreshResult = await refreshAccessToken()
                if (refreshResult.success) {
                    // Add a retry counter to prevent infinite loops
                    const retryCount = (options._retryCount || 0) + 1
                    if (retryCount <= 1) { // Only retry once
                        return MakeApiCalls(endpoint, { ...options, _retryCount: retryCount })
                    }
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError)
            }
        }

        
        return {
            success: false,
            error: 'Authentication expired. Please login again.',
            status: 401,
            needsAuth: true // Flag to indicate auth is needed
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
// === Common fetch wrapper ===
const authHeaders = () => {
  const csrf = getCookie('csrf_access_token');  
  return {
    'X-CSRF-TOKEN': csrf || '',    
  };
};


// === POST request with JSON body ===
export const apiPost = async (url, body) => {
  const res = await fetch(`${API_URL}${url}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body || {})
  });
  return toJson(res);
};

// === PUT request with JSON body ===
export const apiPut = async (url, body = {}) => {
  const res = await fetch(`${API_URL}${url}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body || {})
  });
  return toJson(res);
};

// === DELETE request ===
export const apiDelete = async (url) => {
  const res = await fetch(`${API_URL}${url}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      ...authHeaders(),
    }
  });
  return toJson(res);
};

// === POST request with FormData (e.g. file uploads) ===
export const apiPostForm = async (url, formData) => {
  const res = await fetch(`${API_URL}${url}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...authHeaders(), // don't set Content-Type manually, browser does it for FormData
    },
    body: formData
  });
  return toJson(res);
};

// === GET request for blob/file downloads ===
export const apiGetBlob = async (url) => {
  try {
    const res = await fetch(`${API_URL}${url}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...authHeaders(),
      }
    });

    if (!res.ok) {
      let errorText = '';
      try { errorText = await res.text(); } catch {}
      return { success: false, error: errorText || `Download failed: ${res.status}` };
    }
    const blob = await res.blob();
    return { success: true, data: blob };
  } catch (err) {
    return { success: false, error: err.message || 'Network error' };
  }
};

// === PUT request with FormData (e.g. file uploads) ===
export async function apiPutForm(url, formData) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}${url}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`, // 'Content-Type': 'multipart/form-data', // Let browser set this for FormData
    },
    body: formData,
  });
  return toJson(response);
}
