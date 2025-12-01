import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './components/Toast';
import FloatingChatWidget from './components/FloatingChatWidget';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <ToastProvider>
            <BrowserRouter>
              <App />
              <FloatingChatWidget />
            </BrowserRouter>
          </ToastProvider>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);
