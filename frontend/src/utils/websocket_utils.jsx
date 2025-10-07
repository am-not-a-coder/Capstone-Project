import { io } from 'socket.io-client'
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
let socket = null
let presenceInitialized = false

export const getSocket = () => {
  if (!socket) {
    console.log('🔌 Creating new socket connection...')
    socket = io(API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000
    });
  }
  return socket;
}

//let presenceListenersInitialized = false;

export const initPresenceListeners = () => {
  if (presenceInitialized) return
  presenceInitialized = true
  const socket = getSocket();
  console.log('🔌 Initializing presence listeners...', socket.connected)
  
  const handleUserOnline = (ids) => { 
    console.log('👥 users_online received:', ids); 
    try {
      setOnlineIds(new Set(ids || []))
    } catch (e) {
      console.error('Failed to update presence from users_online', e)
    }
  };
  
  socket.off('users_online').on('users_online', handleUserOnline);

  socket.off('connect').on('connect', () => {})
  socket.off('disconnect').on('disconnect', () => {})
  socket.off('connect_error').on('connect_error', () => {})

  // Status events: self snapshot and global broadcasts
  socket.off('status_response').on('status_response', (data) => {
    try {
      const next = (data && data.status) || 'active'
      setSelfStatusInternal(next)
    } catch {}
  })
  socket.off('broadcast').on('broadcast', ({ userID, status }) => {
    if (!userID) return
    setUserStatusInternal(String(userID), status || 'active')
  })
};

export const resetPresenceListeners = () => {
  const s = getSocket()
  s.off('users_online')
  s.off('connect')
  s.off('disconnect')
  s.off('connect_error')
  s.off('status_response')
  s.off('broadcast')
  
}

let onlineIds = new Set(); let subscribers = new Set();

// --- status store (self + others) ---
let selfStatus = 'active'
const statusSubscribers = new Set()
const userIdToStatus = new Map()

const setSelfStatusInternal = (status) => {
  const next = status || 'active'
  if (selfStatus === next) return
  selfStatus = next
  statusSubscribers.forEach((cb) => { try { cb({ scope: 'self', status: selfStatus }) } catch {} })
}

const setUserStatusInternal = (userId, status) => {
  const id = String(userId)
  const next = status || 'active'
  const prev = userIdToStatus.get(id)
  if (prev === next) return
  userIdToStatus.set(id, next)
  statusSubscribers.forEach((cb) => { try { cb({ scope: 'user', userID: id, status: next }) } catch {} })
}

const setOnlineIds = (idsSet) => {
  // Store a new Set to avoid external mutation
  onlineIds = new Set(idsSet || [])
  // Notify subscribers with a fresh copy
  subscribers.forEach((cb) => {
    try { cb(new Set(onlineIds)) } catch {}
  })
}

export const getOnlineIds = () => new Set(onlineIds)

export const subscribePresence = (cb) => {
  if (typeof cb !== 'function') return () => {}
  subscribers.add(cb)
  // Push current value immediately
  try { cb(new Set(onlineIds)) } catch {}
  // Return unsubscribe
  return () => {
    subscribers.delete(cb)
  }
}

// Expose status subscriptions for consumers
export const subscribeStatus = (cb) => {
  if (typeof cb !== 'function') return () => {}
  statusSubscribers.add(cb)
  try { cb({ scope: 'self', status: selfStatus }) } catch {}
  return () => { statusSubscribers.delete(cb) }
}

export const getUserStatus = (userId) => userIdToStatus.get(String(userId)) || 'active'