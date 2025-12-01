const jwt = require('jsonwebtoken');
const config = require('../config');
const { query } = require('../config/database');

class SocketService {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // Map to store user ID -> socket mapping
    this.onlineUsers = new Map(); // Map to store user online status: userId -> { socketId, role, lastSeen }
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', async (socket) => {
      console.log('New socket connection:', socket.id);

      // Authenticate socket
      socket.on('authenticate', async (data) => {
        try {
          if (!data?.token) {
            throw new Error('No token provided');
          }

          const decoded = jwt.verify(data.token, config.jwtSecret);
          
          // Store user info in socket
          socket.userId = decoded.id;
          socket.userRole = decoded.role;
          
          // Join user's personal room
          socket.join(`user_${decoded.id}`);
          
          // Store in our map
          this.userSockets.set(decoded.id, socket);
          
          // Mark user as online
          this.onlineUsers.set(decoded.id, {
            socketId: socket.id,
            role: decoded.role,
            lastSeen: new Date()
          });
          
          // Broadcast user online status to all connected clients
          this.io.emit('user_status_change', {
            userId: decoded.id,
            status: 'online',
            role: decoded.role
          });
          
          console.log(`User ${decoded.id} (${decoded.role}) authenticated and online`);
          socket.emit('authenticated', { 
            userId: decoded.id, 
            role: decoded.role,
            socketId: socket.id
          });

          // Send list of currently online users
          const onlineUsersList = Array.from(this.onlineUsers.entries()).map(([userId, data]) => ({
            userId,
            role: data.role,
            status: 'online'
          }));
          socket.emit('online_users_list', onlineUsersList);

          // Fetch and send unread count
          const [result] = await query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
            [decoded.id]
          );
          socket.emit('notification_count', { unreadCount: result.count });

        } catch (error) {
          console.error('Authentication error:', error.message);
          socket.emit('auth_error', { message: 'Invalid or missing token' });
        }
      });

      // Auto-authenticate on connection if token is provided
      if (socket.handshake.auth?.token) {
        socket.emit('authenticate', { token: socket.handshake.auth.token });
      }

      // Handle mark as read
      socket.on('mark_notification_read', async (notificationId) => {
        try {
          if (!socket.userId) {
            throw new Error('Authentication required');
          }

          await query(
            'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?',
            [notificationId, socket.userId]
          );

          const [result] = await query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
            [socket.userId]
          );

          socket.emit('notification_count', { unreadCount: result.count });

        } catch (error) {
          console.error('Error marking notification as read:', error);
          socket.emit('error', { message: 'Failed to mark notification as read' });
        }
      });

      // Handle mark all as read
      socket.on('mark_all_notifications_read', async () => {
        try {
          if (!socket.userId) {
            throw new Error('Authentication required');
          }

          await query(
            'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
            [socket.userId]
          );

          socket.emit('notification_count', { unreadCount: 0 });
          socket.emit('notifications_all_read');

        } catch (error) {
          console.error('Error marking all notifications as read:', error);
          socket.emit('error', { message: 'Failed to mark all notifications as read' });
        }
      });

      // Join appointment room
      socket.on('join_appointment', (appointmentId) => {
        if (!socket.userId) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }
        socket.join(`appointment_${appointmentId}`);
        console.log(`User ${socket.userId} joined appointment ${appointmentId}`);
      });

      // Leave appointment
      socket.on('leave_appointment', (appointmentId) => {
        socket.leave(`appointment_${appointmentId}`);
        console.log(`User ${socket.userId} left appointment ${appointmentId}`);
      });

      // Join anonymous chat room
      socket.on('join_anonymous_chat', (chatId) => {
        socket.join(`anonymous_chat_${chatId}`);
        console.log(`User ${socket.userId} joined anonymous chat ${chatId}`);
      });

      // Leave anonymous chat room
      socket.on('leave_anonymous_chat', (chatId) => {
        socket.leave(`anonymous_chat_${chatId}`);
        console.log(`User ${socket.userId} left anonymous chat ${chatId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        if (socket.userId) {
          this.userSockets.delete(socket.userId);
          
          // Mark user as offline and broadcast
          this.onlineUsers.delete(socket.userId);
          this.io.emit('user_status_change', {
            userId: socket.userId,
            status: 'offline',
            role: socket.userRole,
            lastSeen: new Date()
          });
          
          console.log(`User ${socket.userId} is now offline`);
        }
      });

      // Handle appointment messages (legacy + current)
      socket.on('appointment_message', async (data) => {
        try {
          const { appointmentId, message } = data;
          // Save to canonical messages table
          const result = await query(
            'INSERT INTO messages (appointment_id, sender_id, message_type, content, is_read, created_at) VALUES (?, ?, ?, ?, 0, NOW())',
            [appointmentId, socket.userId, 'text', message]
          );
          const [saved] = await query(
            `SELECT m.*,
                    CASE 
                      WHEN COALESCE(a.is_anonymous, (a.notes LIKE '[ANON=1]%')) AND m.sender_id = a.patient_id
                      THEN CONCAT('Khách Ẩn danh #', LPAD(a.patient_id, 4, '0'))
                      ELSE u.full_name
                    END AS sender_name
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             JOIN appointments a ON a.id = m.appointment_id
             WHERE m.id = ?`,
            [result.insertId]
          );
          // Emit to the canonical room only to avoid duplicates
          this.io.to(`appointment_${appointmentId}`).emit('appointment_message', saved);
          this.io.to(`appointment_${appointmentId}`).emit('receive-message', saved);
        } catch (error) {
          console.error('Error handling appointment message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Current frontend event name: send-message → receive-message
      socket.on('send-message', async (data) => {
        try {
          const { appointmentId, content, messageType, senderId } = data || {};
          const effectiveSenderId = socket.userId || senderId;
          console.log('Received send-message:', { appointmentId, content, effectiveSenderId, userRole: socket.userRole });
          
          if (!appointmentId || !effectiveSenderId || !content) {
            console.error('Missing data for send-message:', { appointmentId, effectiveSenderId, content });
            socket.emit('error', { message: 'Thiếu dữ liệu tin nhắn' });
            return;
          }
          const result = await query(
            'INSERT INTO messages (appointment_id, sender_id, message_type, content, is_read, created_at) VALUES (?, ?, ?, ?, 0, NOW())',
            [appointmentId, effectiveSenderId, messageType || 'text', content]
          );
          const [message] = await query(
            `SELECT m.*,
                    CASE 
                      WHEN COALESCE(a.is_anonymous, (a.notes LIKE '[ANON=1]%')) AND m.sender_id = a.patient_id
                      THEN CONCAT('Khách Ẩn danh #', LPAD(a.patient_id, 4, '0'))
                      ELSE u.full_name
                    END AS sender_name
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             JOIN appointments a ON a.id = m.appointment_id
             WHERE m.id = ?`,
            [result.insertId]
          );
          
          console.log('Sending message to room:', `appointment_${appointmentId}`, message);
          // Emit to the canonical room only to avoid duplicates
          this.io.to(`appointment_${appointmentId}`).emit('receive-message', message);
        } catch (error) {
          console.error('Error handling send-message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Mark messages as read when user views the chat
      socket.on('mark_messages_read', async (data) => {
        try {
          const { appointmentId } = data || {};
          const userId = socket.userId;
          
          if (!userId || !appointmentId) {
            console.error('Missing userId or appointmentId for mark_messages_read');
            return;
          }

          // Mark all messages in this appointment as read (except sender's own messages)
          await query(
            'UPDATE messages SET is_read = 1 WHERE appointment_id = ? AND sender_id != ? AND is_read = 0',
            [appointmentId, userId]
          );

          // Notify other participants that messages have been read
          socket.to(`appointment_${appointmentId}`).emit('messages_read', {
            appointmentId,
            readBy: userId
          });

          console.log(`User ${userId} marked messages as read in appointment ${appointmentId}`);
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      });

      // Get read status for messages
      socket.on('get_message_read_status', async (data) => {
        try {
          const { appointmentId } = data || {};
          
          if (!appointmentId) {
            return;
          }

          const messages = await query(
            'SELECT id, is_read FROM messages WHERE appointment_id = ?',
            [appointmentId]
          );

          socket.emit('message_read_status', {
            appointmentId,
            statuses: messages
          });
        } catch (error) {
          console.error('Error getting message read status:', error);
        }
      });

      // Handle anonymous chat messages
      socket.on('anonymous_chat_message', async (data) => {
        try {
          const { chatId, message, senderType } = data;
          console.log('Received anonymous chat message:', { chatId, message, senderType, userId: socket.userId, userRole: socket.userRole });
          
          if (!socket.userId) {
            console.error('Socket not authenticated, cannot send message');
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }
          
          // Nếu counselor gửi tin nhắn đầu tiên khi chat đang "approved", chuyển sang "active"
          try {
            const chats = await query('SELECT status FROM anonymous_chats WHERE id = ?', [chatId]);
            if (chats.length > 0) {
              const currentStatus = chats[0].status;
              if (socket.userRole === 'counselor' && currentStatus === 'approved') {
                await query('UPDATE anonymous_chats SET status = "active" WHERE id = ?', [chatId]);
              }
            }
          } catch (statusErr) {
            console.error('Error updating anonymous chat status to active:', statusErr);
          }

          // Lưu message vào database
          const result = await query(
            'INSERT INTO anonymous_messages (chat_id, sender_id, sender_type, message_type, content, is_anonymous, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [chatId, socket.userId, senderType || (socket.userRole === 'counselor' ? 'counselor' : 'patient'), 'text', message, socket.userRole === 'counselor' ? 0 : 1]
          );

          // Lấy tên thật của chuyên gia nếu cần
          let senderName = 'Người dùng';
          if (socket.userRole === 'counselor') {
            try {
              const counselor = await query('SELECT full_name FROM users WHERE id = ?', [socket.userId]);
              if (counselor.length > 0) {
                senderName = counselor[0].full_name;
              } else {
                senderName = 'Chuyên gia';
              }
            } catch (error) {
              console.error('Error getting counselor name:', error);
              senderName = 'Chuyên gia';
            }
          }

          // Gửi message đến tất cả users trong room
          const messageData = {
            id: result.insertId,
            chat_id: chatId,
            sender_id: socket.userId,
            sender_type: senderType || (socket.userRole === 'counselor' ? 'counselor' : 'patient'),
            sender_name: senderName,
            content: message,
            created_at: new Date().toISOString()
          };
          
          console.log('Broadcasting message to room:', `anonymous_chat_${chatId}`, messageData);
          this.io.to(`anonymous_chat_${chatId}`).emit('anonymous_chat_message', messageData);
        } catch (error) {
          console.error('Error handling anonymous chat message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        socket.to(data.room).emit('user_typing', {
          userId: socket.userId,
          isTyping: true
        });
      });

      socket.on('typing_stop', (data) => {
        socket.to(data.room).emit('user_typing', {
          userId: socket.userId,
          isTyping: false
        });
      });
    });
  }

  // Send notification to specific user
  async sendNotificationToUser(userId, notification) {
    try {
      console.log(`Sending notification to user ${userId}:`, notification);
      this.io.to(`user_${userId}`).emit('notification', notification);
      const [result] = await query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId]
      );
      this.io.to(`user_${userId}`).emit('notification_count', { unreadCount: result.count });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Send role-specific notification
  sendNotificationToRole(role, notification) {
    try {
      console.log(`Sending notification to role ${role}:`, notification);
      this.io.emit('role_notification', { ...notification, targetRole: role });
    } catch (error) {
      console.error('Error sending role notification:', error);
    }
  }

  // Send notification to all users
  sendGlobalNotification(notification) {
    try {
      console.log('Sending global notification:', notification);
      this.io.emit('global_notification', notification);
    } catch (error) {
      console.error('Error sending global notification:', error);
    }
  }

  // Send admin notification
  sendAdminNotification(notification) {
    try {
      console.log('Sending admin notification:', notification);
      this.io.emit('admin_notification', notification);
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }
  }

  // Send counselor notification
  sendCounselorNotification(notification) {
    try {
      console.log('Sending counselor notification:', notification);
      this.io.emit('counselor_notification', notification);
    } catch (error) {
      console.error('Error sending counselor notification:', error);
    }
  }

  // Send notification to all counselors
  sendNotificationToCounselors(notification) {
    this.io.emit('counselor_notification', notification);
  }

  // Send notification to all users 
  sendNotificationToAll(notification) {
    this.io.emit('global_notification', notification);
  }

  // Send appointment update
  sendAppointmentUpdate(appointmentId, update) {
    this.io.to(`appointment_${appointmentId}`).emit('appointment_update', update);
  }

  // Send anonymous chat update
  sendAnonymousChatUpdate(chatId, update) {
    this.io.to(`anonymous_chat_${chatId}`).emit('anonymous_chat_update', update);
  }
}

module.exports = SocketService;
