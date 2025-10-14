import { getCurrentUser, adminHelper, coAdminHelper } from '../utils/auth_utils'

export const PermissionGate = ({ 
    requires, 
    requireAdmin = false, 
    requireCoAdmin = false, 
    requireAny = [],
    fallback = null,
    children 
}) => {
    const user = getCurrentUser()
    const isAdmin = adminHelper()
    const isCoAdmin = coAdminHelper()
    
    if (!user) return fallback
    
    if (requireAdmin && !isAdmin) return fallback
    
    if (requireCoAdmin && !isAdmin && !isCoAdmin) return fallback
    
    if (requires && !user[requires] && !isAdmin) return fallback
    
    if (requireAny.length > 0) {
        const hasAnyPermission = requireAny.some(perm => user[perm])
        if (!hasAnyPermission && !isAdmin) return fallback
    }
    
    return children
}

export default PermissionGate

