import { io } from 'socket.io-client'
let socket = null
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

export const getSocket = () => {
  if (!socket) {
    console.log('🔌 Creating new socket connection...')
    socket = io('http://localhost:5000', {
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

  // Remove the snapshot - let WebSocket handle it
  socket.off('connect').on('connect', () => {
    console.log('Socket connected?', socket.connected)
  });

  // Add disconnect handler for debugging
  socket.off('disconnect').on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  // Add error handler
  socket.off('connect_error').on('connect_error', (error) => {
    console.error('🚨 Socket connection error:', error);
  });
};

let onlineIds = new Set(); let subscribers = new Set();

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