# User Management System Guide

## Overview
Your system has a hierarchical permission structure with three main user levels:
1. **Admin** (full access)
2. **Co-Admin** (limited admin capabilities)
3. **Regular User** (standard access)

---

## Permission Structure (from `models.py`)

### User Permission Fields:
```python
isAdmin = Boolean           # Full system administrator
isCoAdmin = Boolean         # Limited administrator
isRating = Boolean          # Can rate/evaluate documents
isEdit = Boolean            # Can edit users
crudFormsEnable = Boolean   # Can create/update/delete forms
crudProgramEnable = Boolean # Can create/update/delete programs
crudInstituteEnable = Boolean # Can create/update/delete institutes
```

---

## Current Auth Utils (`auth_utils.jsx`)

### Available Helper Functions:

```javascript
// Check if user is logged in
isLoggedIn()

// Get current user object
getCurrentUser()

// Fetch latest user data from server
fetchCurrentUser()

// Check if user is admin
adminHelper()

// Check if user is co-admin
coAdminHelper()

// Logout user
logoutAcc()
```

---

## How to Use Permissions in Your Components

### Method 1: Using Helper Functions (Simple checks)

```javascript
import { adminHelper, coAdminHelper, getCurrentUser } from './utils/auth_utils'

// In your component
const MyComponent = () => {
    const isAdmin = adminHelper()
    const isCoAdmin = coAdminHelper()
    const user = getCurrentUser()
    
    // Show content only for admins
    {isAdmin && (
        <button>Admin Only Action</button>
    )}
    
    // Show content for admins OR co-admins
    {(isAdmin || isCoAdmin) && (
        <button>Admin/Co-Admin Action</button>
    )}
    
    // Show content based on specific permission
    {user?.crudFormsEnable && (
        <button>Create Form</button>
    )}
}
```

### Method 2: Creating Permission Gates (Recommended for Complex Logic)

I'll create additional helper functions for you. Add these to `auth_utils.jsx`:

```javascript
// Check if user has rating permission
export const canRate = () => {
    const user = getCurrentUser()
    if (!user) return false
    // Admins can rate, or users with isRating permission
    return !!user?.isAdmin || !!user?.isRating
}

// Check if user can edit users
export const canEditUsers = () => {
    const user = getCurrentUser()
    if (!user) return false
    // Admins, co-admins, or users with isEdit permission
    return !!user?.isAdmin || !!user?.isCoAdmin || !!user?.isEdit
}

// Check if user can manage forms
export const canManageForms = () => {
    const user = getCurrentUser()
    if (!user) return false
    return !!user?.isAdmin || !!user?.crudFormsEnable
}

// Check if user can manage programs
export const canManagePrograms = () => {
    const user = getCurrentUser()
    if (!user) return false
    return !!user?.isAdmin || !!user?.crudProgramEnable
}

// Check if user can manage institutes
export const canManageInstitutes = () => {
    const user = getCurrentUser()
    if (!user) return false
    return !!user?.isAdmin || !!user?.crudInstituteEnable
}

// Check if user has any admin privileges (admin or co-admin)
export const hasAdminPrivileges = () => {
    const user = getCurrentUser()
    if (!user) return false
    return !!user?.isAdmin || !!user?.isCoAdmin
}
```

---

## Practical Implementation Examples

### Example 1: Protect a Route/Page

```javascript
import { Navigate } from 'react-router-dom'
import { adminHelper, coAdminHelper } from './utils/auth_utils'

const AdminOnlyPage = () => {
    const isAdmin = adminHelper()
    
    if (!isAdmin) {
        return <Navigate to='/Dashboard' replace />
    }
    
    return (
        <div>
            <h1>Admin Only Content</h1>
        </div>
    )
}

const AdminOrCoAdminPage = () => {
    const isAdmin = adminHelper()
    const isCoAdmin = coAdminHelper()
    
    if (!isAdmin && !isCoAdmin) {
        return <Navigate to='/Dashboard' replace />
    }
    
    return (
        <div>
            <h1>Admin/Co-Admin Content</h1>
        </div>
    )
}
```

### Example 2: Conditional Sidebar Links (like in `MainLayout.jsx`)

```javascript
import { getCurrentUser, adminHelper, coAdminHelper } from './utils/auth_utils'

const Sidebar = () => {
    const isAdmin = adminHelper()
    const isCoAdmin = coAdminHelper()
    const user = getCurrentUser()
    
    return (
        <nav>
            {/* Show to everyone */}
            <SidebarLink to="/Dashboard" text="Dashboard" />
            
            {/* Show only to admins */}
            {isAdmin && (
                <SidebarLink to="/Settings" text="System Settings" />
            )}
            
            {/* Show to admins and co-admins */}
            {(isAdmin || isCoAdmin) && (
                <SidebarLink to="/Reports" text="Reports" />
            )}
            
            {/* Show based on specific permission */}
            {(isAdmin || user?.isRating) && (
                <SidebarLink to="/Accreditation" text="Accreditation" />
            )}
            
            {/* Show if user can edit users (admin, co-admin, or has isEdit) */}
            {(isAdmin || isCoAdmin || user?.isEdit) && (
                <SidebarLink to="/Users" text="Users" />
            )}
            
            {/* Show if user can manage programs */}
            {(isAdmin || user?.crudProgramEnable) && (
                <SidebarLink to="/Programs" text="Programs" />
            )}
        </nav>
    )
}
```

### Example 3: Conditional Buttons in UI

```javascript
import { adminHelper, getCurrentUser } from './utils/auth_utils'

const DocumentList = () => {
    const isAdmin = adminHelper()
    const user = getCurrentUser()
    
    return (
        <div>
            <h2>Documents</h2>
            
            {/* Everyone can view */}
            <button>View Documents</button>
            
            {/* Only admins can delete */}
            {isAdmin && (
                <button>Delete Document</button>
            )}
            
            {/* Users with crudFormsEnable can create */}
            {(isAdmin || user?.crudFormsEnable) && (
                <button>Create Form</button>
            )}
            
            {/* Admins or users with rating permission */}
            {(isAdmin || user?.isRating) && (
                <button>Rate Document</button>
            )}
        </div>
    )
}
```

### Example 4: Backend API Protection

Your backend already protects routes properly. Here's the pattern:

```python
@app.route('/api/user', methods=["POST"])
@jwt_required()
def create_user():
    # Check if user is admin
    current_user_id = get_jwt_identity()
    admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
    if not admin_user or not admin_user.isAdmin:
        return jsonify({'success': False, 'message': 'Admins only'}), 403
    
    # Rest of the code...
```

For co-admin access:
```python
@app.route('/api/some-route', methods=["POST"])
@jwt_required()
def some_function():
    current_user_id = get_jwt_identity()
    user = Employee.query.filter_by(employeeID=current_user_id).first()
    
    # Allow admins and co-admins
    if not user or (not user.isAdmin and not user.isCoAdmin):
        return jsonify({'success': False, 'message': 'Admin or Co-Admin only'}), 403
    
    # Rest of the code...
```

For specific permissions:
```python
@app.route('/api/forms', methods=["POST"])
@jwt_required()
def create_form():
    current_user_id = get_jwt_identity()
    user = Employee.query.filter_by(employeeID=current_user_id).first()
    
    # Allow admins or users with crudFormsEnable
    if not user or (not user.isAdmin and not user.crudFormsEnable):
        return jsonify({'success': False, 'message': 'Permission denied'}), 403
    
    # Rest of the code...
```

---

## Permission Hierarchy

```
Admin (isAdmin: true)
├── Full access to everything
├── Can create/edit/delete all users
├── Can assign Co-Admin status
└── Can assign all permissions

Co-Admin (isCoAdmin: true)
├── Can access user management
├── Can view/edit users (if isEdit is true)
├── Can rate documents (if isRating is true)
├── Can manage forms (if crudFormsEnable is true)
├── Can manage programs (if crudProgramEnable is true)
├── Can manage institutes (if crudInstituteEnable is true)
└── Cannot create other admins or co-admins

Regular User
├── Access based on specific permissions
├── isRating: Can rate/evaluate documents
├── isEdit: Can edit user information
├── crudFormsEnable: Can manage forms
├── crudProgramEnable: Can manage programs
└── crudInstituteEnable: Can manage institutes
```

---

## Your Button Fix

The line you highlighted:
```javascript
{employeeID ? 'Update User' : 'Add User'}
```

**This is CORRECT!** It checks if `employeeID` has a value:
- If `employeeID` is filled (editing mode) → Shows "Update User"
- If `employeeID` is empty (create mode) → Shows "Add User"

However, there's one issue: when you click "Users List" or close modals, the `employeeID` should be cleared. I've added a fix to clear it when viewing user details.

---

## Recommended: Create a Permission Component

Create a new file: `frontend/src/components/PermissionGate.jsx`

```javascript
import { getCurrentUser, adminHelper, coAdminHelper } from '../utils/auth_utils'

export const PermissionGate = ({ 
    requires, 
    requireAdmin = false, 
    requireCoAdmin = false, 
    requireAny = [],
    children 
}) => {
    const user = getCurrentUser()
    const isAdmin = adminHelper()
    const isCoAdmin = coAdminHelper()
    
    if (!user) return null
    
    // Check if admin required
    if (requireAdmin && !isAdmin) return null
    
    // Check if co-admin required (admin also passes)
    if (requireCoAdmin && !isAdmin && !isCoAdmin) return null
    
    // Check specific permission
    if (requires && !user[requires] && !isAdmin) return null
    
    // Check if user has ANY of the specified permissions
    if (requireAny.length > 0) {
        const hasAnyPermission = requireAny.some(perm => user[perm])
        if (!hasAnyPermission && !isAdmin) return null
    }
    
    return children
}

// Usage examples:
// <PermissionGate requireAdmin>{children}</PermissionGate>
// <PermissionGate requireCoAdmin>{children}</PermissionGate>
// <PermissionGate requires="isRating">{children}</PermissionGate>
// <PermissionGate requireAny={['isRating', 'isEdit']}>{children}</PermissionGate>
```

Usage in components:
```javascript
import { PermissionGate } from './components/PermissionGate'

<PermissionGate requireAdmin>
    <button>Admin Only Button</button>
</PermissionGate>

<PermissionGate requireCoAdmin>
    <button>Admin/Co-Admin Button</button>
</PermissionGate>

<PermissionGate requires="crudFormsEnable">
    <button>Create Form</button>
</PermissionGate>

<PermissionGate requireAny={['isRating', 'isEdit']}>
    <button>Rate or Edit</button>
</PermissionGate>
```

---

## Testing Your Permissions

1. **Create test users** with different permission combinations
2. **Test each permission level**:
   - Login as Admin → Should see everything
   - Login as Co-Admin → Should see limited admin features
   - Login as Regular User → Should only see features for their permissions

3. **Check both frontend AND backend**:
   - Frontend hides UI elements
   - Backend blocks actual API requests

---

## Next Steps

1. ✅ Your `auth_utils.jsx` has the basic helpers
2. 🔧 Add the additional permission helpers I provided above
3. ✅ Your backend properly checks `isAdmin` and `isCoAdmin`
4. 🔧 Update backend routes to check specific permissions (crudFormsEnable, etc.)
5. 🔧 Apply permission checks to your UI components
6. ✅ Your `Users.jsx` properly sends all permission flags

Would you like me to implement the additional auth helpers and permission gate component?

