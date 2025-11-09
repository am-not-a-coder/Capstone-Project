# Route Protection Guide - Dynamic Permission-Based Routes

## ✅ What I Created for You

I've enhanced your `App.jsx` with **7 different route protection components** that use your permission helpers from `auth_utils.jsx`:

---

## 🛡️ Available Route Protection Components

### 1. **AdminRoute** (Original - Admin Only)
```javascript
<AdminRoute>
  <YourComponent />
</AdminRoute>
```
- **Access:** Admin only (`isAdmin = true`)
- **Use for:** System settings, admin-only features

### 2. **PermissionRoute** (Dynamic - Any Permission)
```javascript
<PermissionRoute permission={canManageForms}>
  <FormsComponent />
</PermissionRoute>
```
- **Access:** Any permission function you pass
- **Use for:** Custom permission checks

### 3. **AdminOrCoAdminRoute** (Admin OR Co-Admin)
```javascript
<AdminOrCoAdminRoute>
  <ReportsComponent />
</AdminOrCoAdminRoute>
```
- **Access:** Admin OR Co-Admin (`isAdmin` OR `isCoAdmin`)
- **Use for:** Admin features that co-admins can also access

### 4. **RatingRoute** (Rating Permission)
```javascript
<RatingRoute>
  <AccreditationComponent />
</RatingRoute>
```
- **Access:** Admin OR users with `isRating = true`
- **Use for:** Document rating, evaluation features

### 5. **UserEditRoute** (User Edit Permission)
```javascript
<UserEditRoute>
  <UsersComponent />
</UserEditRoute>
```
- **Access:** Admin OR Co-Admin OR users with `isEdit = true`
- **Use for:** User management features

### 6. **ProgramsRoute** (Programs Management)
```javascript
<ProgramsRoute>
  <ProgramsComponent />
</ProgramsRoute>
```
- **Access:** Admin OR users with `crudProgramEnable = true`
- **Use for:** Program CRUD operations

### 7. **InstitutesRoute** (Institutes Management)
```javascript
<InstitutesRoute>
  <InstitutesComponent />
</InstitutesRoute>
```
- **Access:** Admin OR users with `crudInstituteEnable = true`
- **Use for:** Institute CRUD operations

---

## 📋 Current Route Protection in Your App

Here's how your routes are now protected:

```javascript
// Dashboard - Everyone (no protection)
<Route path="/Dashboard" element={<Dashboard />} />

// Institutes - Admin OR crudInstituteEnable
<Route path="/Institutes" element={
  <InstitutesRoute>
    <Institutes />
  </InstitutesRoute>
} />

// Programs - Admin OR crudProgramEnable
<Route path="/Programs" element={
  <ProgramsRoute>
    <Programs />
  </ProgramsRoute>
} />

// Accreditation - Admin OR isRating
<Route path="/Accreditation" element={
  <RatingRoute>
    <Accreditation isAdmin={isAdmin}/>
  </RatingRoute>
} />

// Users - Admin OR Co-Admin OR isEdit
<Route path="/Users" element={
  <UserEditRoute>
    <Users isAdmin={isAdmin}/>
  </UserEditRoute>
} />

// Tasks, Documents, Profile - Everyone (no protection)
<Route path="/Tasks" element={<Tasks />} />
<Route path="/Documents" element={<Documents />} />
<Route path="/Profile" element={<Profile />} />
```

---

## 🚀 How to Use Each Component

### Method 1: Using Pre-built Components (Recommended)

```javascript
// For admin-only pages
<Route path="/SystemSettings" element={
  <AdminRoute>
    <SystemSettings />
  </AdminRoute>
} />

// For admin or co-admin pages
<Route path="/Reports" element={
  <AdminOrCoAdminRoute>
    <Reports />
  </AdminOrCoAdminRoute>
} />

// For rating permission
<Route path="/Accreditation" element={
  <RatingRoute>
    <Accreditation />
  </RatingRoute>
} />

// For user management
<Route path="/Users" element={
  <UserEditRoute>
    <Users />
  </UserEditRoute>
} />

// For programs management
<Route path="/Programs" element={
  <ProgramsRoute>
    <Programs />
  </ProgramsRoute>
} />

// For institutes management
<Route path="/Institutes" element={
  <InstitutesRoute>
    <Institutes />
  </InstitutesRoute>
} />
```

### Method 2: Using Dynamic PermissionRoute

```javascript
// For any custom permission check
<Route path="/Forms" element={
  <PermissionRoute permission={canManageForms}>
    <Forms />
  </PermissionRoute>
} />

// With custom fallback path
<Route path="/AdminPanel" element={
  <PermissionRoute 
    permission={adminHelper} 
    fallbackPath="/Unauthorized"
  >
    <AdminPanel />
  </PermissionRoute>
} />

// Multiple permission checks (create custom function)
const canAccessReports = () => {
  return adminHelper() || coAdminHelper() || getCurrentUser()?.isRating
}

<Route path="/Reports" element={
  <PermissionRoute permission={canAccessReports}>
    <Reports />
  </PermissionRoute>
} />
```

---

## 🎯 Examples for Common Scenarios

### Scenario 1: Admin-Only System Settings
```javascript
<Route path="/Settings" element={
  <AdminRoute>
    <SystemSettings />
  </AdminRoute>
} />
```

### Scenario 2: Reports for Admin and Co-Admin
```javascript
<Route path="/Reports" element={
  <AdminOrCoAdminRoute>
    <Reports />
  </AdminOrCoAdminRoute>
} />
```

### Scenario 3: Document Rating (Admin or Rating Permission)
```javascript
<Route path="/Rating" element={
  <RatingRoute>
    <DocumentRating />
  </RatingRoute>
} />
```

### Scenario 4: User Management (Admin, Co-Admin, or Edit Permission)
```javascript
<Route path="/UserManagement" element={
  <UserEditRoute>
    <UserManagement />
  </UserEditRoute>
} />
```

### Scenario 5: Forms Management (Admin or Forms Permission)
```javascript
<Route path="/Forms" element={
  <PermissionRoute permission={canManageForms}>
    <FormsManagement />
  </PermissionRoute>
} />
```

### Scenario 6: Custom Permission (Admin or Multiple Specific Permissions)
```javascript
// Create custom permission function
const canAccessAdvancedFeatures = () => {
  const user = getCurrentUser()
  return adminHelper() || 
         user?.crudFormsEnable || 
         user?.crudProgramEnable ||
         user?.isRating
}

<Route path="/AdvancedFeatures" element={
  <PermissionRoute permission={canAccessAdvancedFeatures}>
    <AdvancedFeatures />
  </PermissionRoute>
} />
```

### Scenario 7: Multiple Permission Levels for Same Page
```javascript
// Different access levels for different features on same page
const AdvancedDashboard = () => {
  const isAdmin = adminHelper()
  const canManageForms = canManageForms()
  const canRate = canRate()
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Everyone sees this */}
      <div>Basic Dashboard Content</div>
      
      {/* Admin only */}
      {isAdmin && (
        <div>Admin Settings</div>
      )}
      
      {/* Admin or Forms permission */}
      {canManageForms && (
        <div>Forms Management</div>
      )}
      
      {/* Admin or Rating permission */}
      {canRate && (
        <div>Document Rating</div>
      )}
    </div>
  )
}

<Route path="/Dashboard" element={<AdvancedDashboard />} />
```

---

## 🔧 Adding New Route Protection Components

If you need a new permission combination, add it to your `App.jsx`:

```javascript
// Example: Forms management route
const FormsRoute = ({ children }) => {
  const allowed = canManageForms()
  useEffect(() => {
    if (authReady && !allowed) toast.error('You have no permission to access this page.')
  }, [authReady, allowed])
  if (!authReady) return <div>Loading...</div>
  return allowed ? children : <Navigate to="/Dashboard" replace />
}

// Use it in your routes
<Route path="/Forms" element={
  <FormsRoute>
    <Forms />
  </FormsRoute>
} />
```

---

## 🎨 Advanced Usage Patterns

### Pattern 1: Nested Route Protection
```javascript
// Parent route with one protection, child routes with different protections
<Route path="/Management" element={
  <AdminOrCoAdminRoute>
    <ManagementLayout />
  </AdminOrCoAdminRoute>
}>
  <Route path="users" element={
    <UserEditRoute>
      <Users />
    </UserEditRoute>
  } />
  <Route path="programs" element={
    <ProgramsRoute>
      <Programs />
    </ProgramsRoute>
  } />
  <Route path="settings" element={
    <AdminRoute>
      <Settings />
    </AdminRoute>
  } />
</Route>
```

### Pattern 2: Conditional Route Protection
```javascript
// Different protection based on user type
const ConditionalRoute = ({ children }) => {
  const isAdmin = adminHelper()
  const isCoAdmin = coAdminHelper()
  
  if (isAdmin) {
    return <AdminRoute>{children}</AdminRoute>
  } else if (isCoAdmin) {
    return <AdminOrCoAdminRoute>{children}</AdminOrCoAdminRoute>
  } else {
    return <Navigate to="/Dashboard" replace />
  }
}
```

### Pattern 3: Permission-Based Route Parameters
```javascript
// Route that changes behavior based on permission
<Route path="/Data/:viewType" element={
  <PermissionRoute permission={() => {
    const viewType = window.location.pathname.split('/').pop()
    if (viewType === 'admin') return adminHelper()
    if (viewType === 'reports') return hasAdminPrivileges()
    return true // Default access
  }}>
    <DataViewer />
  </PermissionRoute>
} />
```

---

## 🧪 Testing Your Route Protection

### Test Each Permission Level:

**As Admin:**
- [ ] Can access all protected routes
- [ ] Can access admin-only routes
- [ ] Can access co-admin routes
- [ ] Can access permission-based routes

**As Co-Admin:**
- [ ] Cannot access admin-only routes
- [ ] Can access co-admin routes
- [ ] Can access routes based on assigned permissions
- [ ] Cannot access routes without permission

**As Regular User:**
- [ ] Cannot access admin-only routes
- [ ] Cannot access co-admin routes
- [ ] Can access routes based on specific permissions only
- [ ] Gets redirected to Dashboard when no permission

---

## 🚨 Important Notes

1. **Route protection is for UI only** - Always validate permissions on backend too
2. **Permission checks happen on every render** - They're reactive to user state changes
3. **Loading state** - All routes show "Loading..." while `authReady` is false
4. **Error messages** - Users get toast notifications when access is denied
5. **Fallback behavior** - Users are redirected to Dashboard (or custom path)

---

## 📝 Quick Reference Table

| Component | Permission Required | Use Case |
|-----------|-------------------|----------|
| `AdminRoute` | Admin only | System settings, admin features |
| `AdminOrCoAdminRoute` | Admin OR Co-Admin | Reports, limited admin features |
| `RatingRoute` | Admin OR isRating | Document rating, evaluation |
| `UserEditRoute` | Admin OR Co-Admin OR isEdit | User management |
| `ProgramsRoute` | Admin OR crudProgramEnable | Program CRUD |
| `InstitutesRoute` | Admin OR crudInstituteEnable | Institute CRUD |
| `PermissionRoute` | Custom permission function | Any custom check |

---

## 🎉 You're All Set!

Your routes are now properly protected with dynamic permission-based access control. Users will only see and access the features they have permission for, and they'll get clear feedback when they try to access restricted content.

**Next Steps:**
1. Test each route with different user permission levels
2. Add any missing route protection for new pages
3. Consider adding permission checks to individual components within pages
4. Update your sidebar links to match the route permissions

---

## 🔧 Need a Custom Permission Route?

If you need a permission combination that doesn't exist, just ask! I can help you create it quickly using the same pattern.

For example:
- "Admin or users with both rating AND edit permissions"
- "Co-admin or users with forms AND programs permissions"
- "Any user with at least 2 specific permissions"

Just let me know what permission logic you need! 🚀
