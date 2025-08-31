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
  const handleUserOnline = (ids) => { 
    console.log('👥 users_online received:', ids); 
  };
  
  socket.off('users_online').on('users_online', handleUserOnline);

 // Snapshot on every connect/reconnect
  socket.off('connect').on('connect', () => {
    console.log('Socket connected?', socket.connected)
    import('./api_utils').then(({ apiGet }) => {
      apiGet('/api/users/online-status').then(r => {
        if (r.success) console.log('📸 users_online snapshot on connect:', r.data.users.map(u => u.employeeID));
      });
    });
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