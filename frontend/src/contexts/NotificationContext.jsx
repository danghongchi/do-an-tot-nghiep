import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import api from '../services/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !socket) return;

    // Listen for new notifications
    socket.on('notification', handleNewNotification);
    socket.on('role_notification', handleRoleNotification);
    socket.on('admin_notification', handleAdminNotification);
    socket.on('counselor_notification', handleCounselorNotification);
    socket.on('global_notification', handleGlobalNotification);
    socket.on('notification_count', handleNotificationUpdate);

    // Fetch initial notifications
    fetchNotifications();

    return () => {
      socket.off('notification');
      socket.off('role_notification');
      socket.off('admin_notification');
      socket.off('counselor_notification');
      socket.off('global_notification');
      socket.off('notification_count');
    };
  }, [user, socket]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=20');
      const items = res.data || [];
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const handleRoleNotification = (notification) => {
    if (user.role === notification.targetRole) {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
  };

  const handleAdminNotification = (notification) => {
    if (user.role === 'admin') {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
  };

  const handleCounselorNotification = (notification) => {
    if (user.role === 'counselor') {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
  };

  const handleGlobalNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const handleNotificationUpdate = ({ unreadCount: newCount }) => {
    setUnreadCount(newCount);
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      if (socket) socket.emit('mark_notification_read', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      if (socket) socket.emit('mark_all_notifications_read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
