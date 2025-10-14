# Permission System - Practical Usage Examples

## Quick Reference

### Import Statements
```javascript
// Basic helpers
import { 
    adminHelper, 
    coAdminHelper, 
    getCurrentUser,
    hasAdminPrivileges 
} from './utils/auth_utils'

// Specific permission helpers
import { 
    canRate,
    canEditUsers,
    canManageForms,
    canManagePrograms,
    canManageInstitutes
} from './utils/auth_utils'

// Permission Gate component
import { PermissionGate } from './components/PermissionGate'
```

---

## Example 1: Protecting a Page (Full Admin Only)

```javascript
import { Navigate } from 'react-router-dom'
import { adminHelper } from '../utils/auth_utils'

const SystemSettings = () => {
    const isAdmin = adminHelper()
    
    if (!isAdmin) {
        return <Navigate to='/Dashboard' replace />
    }
    
    return (
        <div>
            <h1>System Settings</h1>
            <p>Only full admins can access this page</p>
        </div>
    )
}

export default SystemSettings
```

---

## Example 2: Protecting a Page (Admin or Co-Admin)

```javascript
import { Navigate } from 'react-router-dom'
import { hasAdminPrivileges } from '../utils/auth_utils'

const Reports = () => {
    const hasAccess = hasAdminPrivileges()
    
    if (!hasAccess) {
        return <Navigate to='/Dashboard' replace />
    }
    
    return (
        <div>
            <h1>Reports</h1>
            <p>Admins and Co-Admins can view reports</p>
        </div>
    )
}

export default Reports
```

---

## Example 3: Protecting a Page (Specific Permission)

```javascript
import { Navigate } from 'react-router-dom'
import { canManagePrograms } from '../utils/auth_utils'

const ProgramManagement = () => {
    if (!canManagePrograms()) {
        return <Navigate to='/Dashboard' replace />
    }
    
    return (
        <div>
            <h1>Program Management</h1>
            <p>Users with crudProgramEnable or admins can access this</p>
        </div>
    )
}

export default ProgramManagement
```

---

## Example 4: Conditional UI Elements

```javascript
import { 
    adminHelper, 
    canRate, 
    canManageForms,
    getCurrentUser 
} from '../utils/auth_utils'

const DocumentPage = () => {
    const isAdmin = adminHelper()
    const user = getCurrentUser()
    
    return (
        <div>
            <h1>Documents</h1>
            
            {/* Everyone can view */}
            <button>View Documents</button>
            
            {/* Only admins can delete */}
            {isAdmin && (
                <button className="btn-danger">Delete All</button>
            )}
            
            {/* Users with rating permission */}
            {canRate() && (
                <button>Rate Document</button>
            )}
            
            {/* Users with form management permission */}
            {canManageForms() && (
                <button>Create New Form</button>
            )}
            
            {/* Check specific permission directly */}
            {(isAdmin || user?.crudFormsEnable) && (
                <button>Edit Form</button>
            )}
        </div>
    )
}

export default DocumentPage
```

---

## Example 5: Using PermissionGate Component

```javascript
import { PermissionGate } from '../components/PermissionGate'

const Dashboard = () => {
    return (
        <div>
            <h1>Dashboard</h1>
            
            {/* Admin only section */}
            <PermissionGate requireAdmin>
                <div className="admin-panel">
                    <h2>Admin Panel</h2>
                    <button>System Settings</button>
                    <button>Manage All Users</button>
                </div>
            </PermissionGate>
            
            {/* Admin or Co-Admin section */}
            <PermissionGate requireCoAdmin>
                <div className="reports-section">
                    <h2>Reports</h2>
                    <button>View Reports</button>
                </div>
            </PermissionGate>
            
            {/* Specific permission - rating */}
            <PermissionGate requires="isRating">
                <div className="rating-section">
                    <h2>Document Rating</h2>
                    <button>Rate Documents</button>
                </div>
            </PermissionGate>
            
            {/* Specific permission - forms management */}
            <PermissionGate requires="crudFormsEnable">
                <div className="forms-section">
                    <h2>Forms Management</h2>
                    <button>Create Form</button>
                    <button>Edit Forms</button>
                </div>
            </PermissionGate>
            
            {/* User has ANY of these permissions */}
            <PermissionGate requireAny={['isRating', 'isEdit', 'crudFormsEnable']}>
                <div className="advanced-features">
                    <h2>Advanced Features</h2>
                    <p>You have special permissions!</p>
                </div>
            </PermissionGate>
            
            {/* With fallback content */}
            <PermissionGate 
                requireAdmin 
                fallback={<p>You need admin access to view this</p>}
            >
                <div className="secret-content">
                    <h2>Top Secret Admin Content</h2>
                </div>
            </PermissionGate>
        </div>
    )
}

export default Dashboard
```

---

## Example 6: Sidebar with Permissions (Like MainLayout)

```javascript
import { 
    adminHelper, 
    coAdminHelper, 
    getCurrentUser,
    canManagePrograms,
    canManageInstitutes 
} from '../utils/auth_utils'

const Sidebar = () => {
    const isAdmin = adminHelper()
    const isCoAdmin = coAdminHelper()
    const user = getCurrentUser()
    
    return (
        <nav className="sidebar">
            {/* Everyone sees Dashboard */}
            <SidebarLink 
                to="/Dashboard" 
                icon={faDashboard}
                text="Dashboard" 
            />
            
            {/* Admin only - System Settings */}
            {isAdmin && (
                <SidebarLink 
                    to="/Settings" 
                    icon={faGear}
                    text="System Settings" 
                />
            )}
            
            {/* Admin or Co-Admin - Reports */}
            {(isAdmin || isCoAdmin) && (
                <SidebarLink 
                    to="/Reports" 
                    icon={faChartBar}
                    text="Reports" 
                />
            )}
            
            {/* Admin or users with rating permission */}
            {(isAdmin || user?.isRating) && (
                <SidebarLink 
                    to="/Accreditation" 
                    icon={faIdCardClip}
                    text="Accreditation" 
                />
            )}
            
            {/* Admin, Co-Admin, or users with edit permission */}
            {(isAdmin || isCoAdmin || user?.isEdit) && (
                <SidebarLink 
                    to="/Users" 
                    icon={faUsers}
                    text="Users" 
                />
            )}
            
            {/* Using helper function */}
            {canManagePrograms() && (
                <SidebarLink 
                    to="/Programs" 
                    icon={faGraduationCap}
                    text="Programs" 
                />
            )}
            
            {/* Using helper function */}
            {canManageInstitutes() && (
                <SidebarLink 
                    to="/Institutes" 
                    icon={faBuilding}
                    text="Institutes" 
                />
            )}
            
            {/* Multiple permissions check */}
            {(isAdmin || user?.crudFormsEnable) && (
                <SidebarLink 
                    to="/Forms" 
                    icon={faFileAlt}
                    text="Forms" 
                />
            )}
        </nav>
    )
}

export default Sidebar
```

---

## Example 7: Table with Action Buttons

```javascript
import { adminHelper, canEditUsers } from '../utils/auth_utils'

const UserTable = ({ users }) => {
    const isAdmin = adminHelper()
    const canEdit = canEditUsers()
    
    return (
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    {canEdit && <th>Actions</th>}
                </tr>
            </thead>
            <tbody>
                {users.map(user => (
                    <tr key={user.employeeID}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.isAdmin ? 'Admin' : 'User'}</td>
                        {canEdit && (
                            <td>
                                <button onClick={() => handleEdit(user)}>
                                    Edit
                                </button>
                                
                                {/* Only admin can delete */}
                                {isAdmin && (
                                    <button 
                                        onClick={() => handleDelete(user)}
                                        className="btn-danger"
                                    >
                                        Delete
                                    </button>
                                )}
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default UserTable
```

---

## Example 8: Form with Conditional Fields

```javascript
import { adminHelper, coAdminHelper } from '../utils/auth_utils'

const UserForm = () => {
    const isAdmin = adminHelper()
    const isCoAdmin = coAdminHelper()
    
    return (
        <form>
            {/* Basic fields - everyone can see */}
            <input name="firstName" placeholder="First Name" />
            <input name="lastName" placeholder="Last Name" />
            <input name="email" type="email" placeholder="Email" />
            
            {/* Admin only - can assign Co-Admin */}
            {isAdmin && (
                <div>
                    <label>Co-Admin Access</label>
                    <input type="checkbox" name="isCoAdmin" />
                </div>
            )}
            
            {/* Admin or Co-Admin - can assign permissions */}
            {(isAdmin || isCoAdmin) && (
                <div className="permissions-section">
                    <h3>Permissions</h3>
                    
                    <label>
                        <input type="checkbox" name="isRating" />
                        Rating Access
                    </label>
                    
                    <label>
                        <input type="checkbox" name="isEdit" />
                        Can Edit Users
                    </label>
                    
                    {/* Only admin can assign CRUD permissions */}
                    {isAdmin && (
                        <>
                            <label>
                                <input type="checkbox" name="crudFormsEnable" />
                                CRUD Forms
                            </label>
                            
                            <label>
                                <input type="checkbox" name="crudProgramEnable" />
                                CRUD Programs
                            </label>
                            
                            <label>
                                <input type="checkbox" name="crudInstituteEnable" />
                                CRUD Institutes
                            </label>
                        </>
                    )}
                </div>
            )}
            
            <button type="submit">Save User</button>
        </form>
    )
}

export default UserForm
```

---

## Example 9: Custom Hook for Permissions

Create: `frontend/src/hooks/usePermissions.js`

```javascript
import { 
    adminHelper, 
    coAdminHelper, 
    getCurrentUser,
    canRate,
    canEditUsers,
    canManageForms,
    canManagePrograms,
    canManageInstitutes,
    hasAdminPrivileges
} from '../utils/auth_utils'

export const usePermissions = () => {
    const user = getCurrentUser()
    const isAdmin = adminHelper()
    const isCoAdmin = coAdminHelper()
    
    return {
        user,
        isAdmin,
        isCoAdmin,
        hasAdminPrivileges: hasAdminPrivileges(),
        
        // Specific permission checks
        canRate: canRate(),
        canEditUsers: canEditUsers(),
        canManageForms: canManageForms(),
        canManagePrograms: canManagePrograms(),
        canManageInstitutes: canManageInstitutes(),
        
        // Direct permission access
        isRating: user?.isRating || false,
        isEdit: user?.isEdit || false,
        crudFormsEnable: user?.crudFormsEnable || false,
        crudProgramEnable: user?.crudProgramEnable || false,
        crudInstituteEnable: user?.crudInstituteEnable || false,
    }
}
```

Usage:
```javascript
import { usePermissions } from '../hooks/usePermissions'

const MyComponent = () => {
    const { 
        isAdmin, 
        isCoAdmin, 
        canRate, 
        canManageForms 
    } = usePermissions()
    
    return (
        <div>
            {isAdmin && <AdminSection />}
            {isCoAdmin && <CoAdminSection />}
            {canRate && <RatingSection />}
            {canManageForms && <FormsSection />}
        </div>
    )
}
```

---

## Example 10: API Call with Permission Check

```javascript
import { adminHelper } from '../utils/auth_utils'
import { apiPost } from '../utils/api_utils'

const deleteUser = async (userId) => {
    // Double-check permission before making API call
    if (!adminHelper()) {
        alert('You do not have permission to delete users')
        return
    }
    
    try {
        const res = await apiPost(`/api/user/${userId}`, {
            method: 'DELETE'
        })
        
        if (res.success) {
            alert('User deleted successfully')
        }
    } catch (error) {
        console.error('Delete failed:', error)
        alert('Failed to delete user')
    }
}
```

---

## Testing Checklist

### Test as Admin:
- [ ] Can access all pages
- [ ] Can see all buttons and features
- [ ] Can create/edit/delete users
- [ ] Can assign Co-Admin status
- [ ] Can assign all permissions

### Test as Co-Admin:
- [ ] Can access user management
- [ ] Can see assigned permission features
- [ ] Cannot access admin-only features
- [ ] Cannot create other admins

### Test as Regular User:
- [ ] Can only access permitted features
- [ ] Cannot see admin/co-admin sections
- [ ] API calls are blocked if no permission
- [ ] Redirected from protected pages

---

## Common Patterns

### Pattern 1: Multiple Permission Check
```javascript
{(isAdmin || user?.isRating || user?.isEdit) && (
    <button>Action</button>
)}
```

### Pattern 2: Nested Permission Check
```javascript
{(isAdmin || isCoAdmin) && (
    <div>
        <h2>Admin Area</h2>
        
        {isAdmin && (
            <button>Admin Only Action</button>
        )}
        
        <button>Both Admin and Co-Admin</button>
    </div>
)}
```

### Pattern 3: Permission with Fallback UI
```javascript
{isAdmin ? (
    <button>Delete</button>
) : (
    <span className="text-gray-400">No permission</span>
)}
```

---

## Quick Tips

1. **Always check permissions on BOTH frontend and backend**
2. **Frontend hides UI, backend blocks API calls**
3. **Admins bypass all permission checks**
4. **Use helper functions for cleaner code**
5. **Use PermissionGate component for complex checks**
6. **Test with different user roles**
7. **Don't trust frontend checks alone - always validate on backend**

---

## Need Help?

Refer to `USER_MANAGEMENT_GUIDE.md` for detailed explanations of:
- Permission structure
- Backend protection patterns
- Creating new permission checks
- Permission hierarchy

