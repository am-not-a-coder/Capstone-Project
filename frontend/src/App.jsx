import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import { isLoggedIn } from './utils/auth_utils';
// Importing Pages
import Login from './pages/Login';
import MainLayout from './MainLayout';
import Dashboard from './pages/Dashboard';
import Accreditation from './pages/Accreditation';
import Documents from './pages/Documents';
import Programs from './pages/Programs';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Notification from './pages/Notification';
import Messages from './pages/Messages';
import AreaProgress from './pages/AreaProgress';
import Templates from './pages/Templates';
import { fetchCurrentUser } from './utils/auth_utils';
import { useEffect, useRef, useState } from 'react';
import { 
  logoutAcc, 
  adminHelper, 
  coAdminHelper,
  canRate,
  canEditUsers,
  canManageForms,
  hasAdminPrivileges 
} from './utils/auth_utils';
import { apiPost } from './utils/api_utils';
import { initPresenceListeners, getSocket } from './utils/websocket_utils';
import toast, { Toaster } from 'react-hot-toast'

function App() {
  
  // Admin only route
  const AdminRoute = ({ children }) => {
    const allowed = adminHelper()
    useEffect(() => {
      if (authReady && !allowed) toast.error('You have no permission to access this page.')
    }, [authReady, allowed])
    if (!authReady) return <div>Loading...</div>
    return allowed ? children : <Navigate to="/Dashboard" replace />
  }

  // Dynamic permission route - can check any permission
  const PermissionRoute = ({ permission, children, fallbackPath = "/Dashboard" }) => {
    const allowed = permission()
    useEffect(() => {
      if (authReady && !allowed) toast.error('You have no permission to access this page.')
    }, [authReady, allowed])
    if (!authReady) return <div>Loading...</div>
    return allowed ? children : <Navigate to={fallbackPath} replace />
  }

  // Admin or Co-Admin route
  const AdminOrCoAdminRoute = ({ children }) => {
    const allowed = hasAdminPrivileges()
    useEffect(() => {
      if (authReady && !allowed) toast.error('You have no permission to access this page.')
    }, [authReady, allowed])
    if (!authReady) return <div>Loading...</div>
    return allowed ? children : <Navigate to="/Dashboard" replace />
  }

  // Rating permission route
  const RatingRoute = ({ children }) => {
    const allowed = canRate()
    useEffect(() => {
      if (authReady && !allowed) toast.error('You have no permission to access this page.')
    }, [authReady, allowed])
    if (!authReady) return <div>Loading...</div>
    return allowed ? children : <Navigate to="/Dashboard" replace />
  }

  // User edit permission route
  const UserEditRoute = ({ children }) => {
    const allowed = canEditUsers()
    useEffect(() => {
      if (authReady && !allowed) toast.error('You have no permission to access this page.')
    }, [authReady, allowed])
    if (!authReady) return <div>Loading...</div>
    return allowed ? children : <Navigate to="/Dashboard" replace />
  }




  const [authReady, setAuthReady] = useState(false)
  const [authTick, setAuthTick] = useState(0)
  const isAdmin = adminHelper()
  

  const awayTimeRef = useRef(null)
  const lastStatusRef = useRef('active')
  const mouseMoveThrottleRef = useRef(false)

  // Monitor authReady changes
  useEffect(() => {
 
  }, [authReady])

  

  const handleMouse = async () => {
    if (localStorage.getItem('user')) {
      try {
        // Get existing session ID from localStorage
        const existingSessionId = localStorage.getItem('session_id')
        const user = JSON.parse(localStorage.getItem('user'))

        if (existingSessionId) {
         
          
          // Validate existing session
          const validationResponse = await apiPost('/api/validate-session', { 
            session_id: existingSessionId 
          })

          if (!validationResponse.success) {
            

            // Audit session expiration BEFORE clearing storage
            if (user) {
              try {
                  apiPost('/api/session-expired', {
                  employeeID: user.employeeID,
                  session_id: existingSessionId
                })
              } catch (err) {console.error('Failed to audit session expiration:', err)}
            }
            
            // Clear all storage
            localStorage.removeItem('session_id')
            localStorage.removeItem('user')
            localStorage.removeItem('LoggedIn')
            sessionStorage.removeItem('user')
            sessionStorage.removeItem('LoggedIn')
            sessionStorage.removeItem('welcomeShown')
            for (const k of Object.keys(sessionStorage)) {
              if (k.startsWith('welcomeShown:')) sessionStorage.removeItem(k)
            }
            
            // Broadcast logout to other tabs
            const ch = new BroadcastChannel('auth')
            ch.postMessage({ type: 'logout', ts: Date.now() })
            ch.close()
            
            // Force logout
            await logoutAcc()
            
            // Redirect to login
            window.location.href = '/login'
          }
        }
      } catch (error) {
        console.error('Mouse handler error', error)
      }
    }
} 
let isComponentMounted = true

const loadUser = async () => {
  try {
    if (localStorage.getItem('session_id')) {

      try {
        await fetchCurrentUser() 
        sessionStorage.removeItem('welcomeShown')
        for (const k of Object.keys(sessionStorage)) {
          if (k.startsWith('welcomeShown:')) sessionStorage.removeItem(k)
        }
        initPresenceListeners()
        const socket = getSocket()
        if (socket.connected) {
          startInactivityTimer()
        } else {
          socket.once('connect', () => {
            startInactivityTimer()
          })
        }
      } catch (error) {
        // Session is invalid, clear everything
        localStorage.removeItem('session_id')
        localStorage.removeItem('user')
        localStorage.removeItem('LoggedIn')
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('LoggedIn')
        sessionStorage.removeItem('welcomeShown')
        for (const k of Object.keys(sessionStorage)) {
          if (k.startsWith('welcomeShown:')) sessionStorage.removeItem(k)
        }
      }
    } else {
    }
  } catch (error) {
    console.error('Error loading user:', error)
  } finally {
    setAuthReady(true)
  }
}

const startInactivityTimer = () => {
  try {
    const socket = getSocket()

    if (lastStatusRef.current === 'away') return

    if (awayTimeRef.current) clearTimeout(awayTimeRef.current)

    awayTimeRef.current = setTimeout(() => {
      try {
        socket.emit('check_status', (res) => {
          if (res && res.user_status === 'active') {
            socket.emit('status_change', 'away', (ack) => {
              if (ack && ack.updated) {
                lastStatusRef.current = 'away'
              }
            })
            return
          }
          return
        })
      } catch (err) {
        console.error('[timer] emit error', err)
        return
      }
    }, 5000)
  } catch (err) {
    console.error('[timer] setup error', err)
  }
}

const resetInactivityTimer = () => {
  if (!localStorage.getItem('user')) return
  try {
    const socket = getSocket()
    if (socket && socket.connected && lastStatusRef.current !== 'active') {
      socket.emit('status_change', 'active')
      lastStatusRef.current = 'active'
    }
  } catch {}
  startInactivityTimer()
}

const stopInactivityTimer = () => {
  if (awayTimeRef.current) {
    clearTimeout(awayTimeRef.current)
    awayTimeRef.current = null
  }
}

useEffect(() => {
  
    // Check if we're on the login page and clear session_id
    if (window.location.pathname === '/login') {
      localStorage.removeItem('session_id')
      localStorage.removeItem('user')
      localStorage.removeItem('LoggedIn')
      sessionStorage.removeItem('welcomeShown')
      for (const k of Object.keys(sessionStorage)) {
        if (k.startsWith('welcomeShown:')) sessionStorage.removeItem(k)
      }
    }

  const ch = new BroadcastChannel('auth');

  //event listeners
  window.addEventListener('click', handleMouse)
  window.addEventListener('click', resetInactivityTimer)
  const onMouseMove = () => {
    if (mouseMoveThrottleRef.current) return
    mouseMoveThrottleRef.current = true
    resetInactivityTimer()
    setTimeout(() => { mouseMoveThrottleRef.current = false }, 1500)
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('keydown', resetInactivityTimer)

  ch.onmessage = async (e) => {
    const { type } = e.data || {};
    if (type === 'login') {
      // Clear any stale welcome flags before showing dashboard
      sessionStorage.removeItem('welcomeShown')
      for (const k of Object.keys(sessionStorage)) {
        if (k.startsWith('welcomeShown:')) sessionStorage.removeItem(k)
      }
      initPresenceListeners()
      await fetchCurrentUser()
      setAuthTick(t => t + 1)
      const socket = getSocket()
      if (socket.connected) {
        startInactivityTimer()
      } else {
        socket.once('connect', () => {
          startInactivityTimer()
        })
      }
    }
    if (type === 'logout') {
      // Clear storage immediately
      localStorage.removeItem('session_id')
      localStorage.removeItem('user')
      localStorage.removeItem('LoggedIn')
      sessionStorage.removeItem('welcomeShown')
      for (const k of Object.keys(sessionStorage)) {
        if (k.startsWith('welcomeShown:')) sessionStorage.removeItem(k)
      }
      // Force logout
      logoutAcc()
      setAuthTick(t => t + 1);
      stopInactivityTimer()
    }
  }
  
  loadUser()
  
  // Fallback timeout to ensure authReady gets set
  const fallbackTimeout = setTimeout(() => {
    setAuthReady(true)
  }, 3000) // 3 second timeout

  const handler = (e) => {
    const { type, msg } = e.detail || {}
    if (type === 'error') toast.error(msg || 'Error')
    else if (type === 'success') toast.success(msg || 'Success')
    else toast(msg || 'Notice')
  }
  window.addEventListener('app:toast', handler)

  return () => {
    clearTimeout(fallbackTimeout)
    isComponentMounted = false
    ch.close()
    window.removeEventListener('click', handleMouse)
    window.removeEventListener('click', resetInactivityTimer)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('keydown', resetInactivityTimer)
    window.removeEventListener('app:toast', handler)
    stopInactivityTimer()
  }
  
}, []) 



// If the user is not logged in it will redirect to login page
const ProtectedRoute = ({children}) => {
  
  if (!authReady) {
    
    return <div style={{padding: '20px', fontSize: '18px', color: 'blue'}}>Loading... Please wait</div>
  } else {
    const loggedIn = isLoggedIn()
    
    return loggedIn ? children : <Navigate to="/login" />
  }
}

//public route
const PublicOnlyRoute = ({ children }) => { 
  if (!authReady) return <div>Loading...</div>
  return isLoggedIn() ? <Navigate to="/Dashboard" replace /> : children
}


  
  return (
    <Router>
      <Toaster />
      <Routes>
        <Route 
        path="/login" 
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
        />
        
        {/* These are the routes that needs authentication */}
        {/* MainLayout wraps other pages */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
          }>
          <Route index element={<Navigate to="/Dashboard" replace />} />
          <Route path="/Dashboard" element={<Dashboard />} />          
          <Route path="/Programs" element={<Programs />} />
          <Route path="/Accreditation" element={
            <RatingRoute>
              <Accreditation isAdmin={isAdmin}/>
            </RatingRoute>} />
          <Route path="/Users" element={
            <UserEditRoute>
              <Users isAdmin={isAdmin}/>
            </UserEditRoute>
            } />
          <Route path="/Templates" element={
            <AdminRoute>
              <Templates isAdmin={isAdmin}/>
            </AdminRoute>
            } />
          <Route path="/Progress" element={<AreaProgress />} />
          <Route path="/Documents" element={<Documents />} />

        {/* Profile page */}
         <Route path='/Profile' element={<Profile />}/>
         <Route path='/Notification' element={<Notification />}/>
         <Route path='/Messages' element={<Messages />} />
        </Route>

      </Routes>
    </Router>
  )
}


export default App;
