import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketState, setSocketState] = useState(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Tạo kết nối socket
    const socketUrl = import.meta.env.VITE_API_URL ? 
      import.meta.env.VITE_API_URL.replace('/api', '') : 
      'http://localhost:5000';
    
    socketRef.current = io(socketUrl, {
      auth: { token },
      // Let the client start with polling and upgrade automatically to websocket
      // This avoids "WebSocket is closed before the connection is established" on some setups
      // Do not force transports; rely on defaults
      withCredentials: true,
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    setSocketState(socketRef.current);

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      // Explicitly authenticate so server can join user room
      try { socketRef.current.emit('authenticate', { token }); } catch {}
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
      setSocketState(null);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error?.message || error);
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      setSocketState(null);
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ 
      socket: socketState, 
      isConnected 
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
