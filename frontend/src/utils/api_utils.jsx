
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
        // Handle authentication failures
            const response = await fetch(fullUrl, finalOptions)
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
