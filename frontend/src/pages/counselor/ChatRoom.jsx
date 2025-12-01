import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import EmojiPicker from '../../components/EmojiPicker';

export default function CounselorChatRoom(){
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const listRef = useRef();
  const recognitionRef = useRef(null);

  // Load messages and appointment info
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load messages
        const messagesRes = await api.get(`/appointments/${appointmentId}/messages`);
        setMessages(messagesRes.data || []);
        
        // Load appointment info
        const appointmentsRes = await api.get('/counselors/appointments');
        const appointmentData = appointmentsRes.data.find(apt => apt.id == appointmentId);
        setAppointment(appointmentData);
        
        if (!appointmentData) {
          alert('Không tìm thấy lịch hẹn');
          navigate('/counselor/schedule');
          return;
        }
      } catch (err) {
        console.error('Error loading chat data:', err);
        alert('Không thể tải dữ liệu chat');
        navigate('/counselor/schedule');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [appointmentId, navigate]);

  // Socket connection
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('Counselor joining appointment room:', appointmentId);
    socket.emit('join_appointment', appointmentId);
    
    // Mark messages as read when entering chat
    socket.emit('mark_messages_read', { appointmentId });
    
    const handleReceiveMessage = (msg) => {
      console.log('Counselor received message:', msg);
      setMessages(prev => [...prev, msg]);
      
      // If message is from other user, mark as read immediately
      if (msg.sender_id !== user.id) {
        socket.emit('mark_messages_read', { appointmentId });
      }
    };
    
    const handleMessagesRead = (data) => {
      console.log('Messages read by other user:', data);
      // Update all sender's messages to read status
      setMessages(prev => 
        prev.map(msg => 
          msg.sender_id === user.id ? { ...msg, is_read: 1 } : msg
        )
      );
    };
    
    const handleAppointmentUpdate = (update) => {
      if (!update || String(update.appointmentId) !== String(appointmentId)) return;
      setAppointment(prev => prev ? { ...prev, status: update.status } : prev);
    };
    
    const handleError = (error) => {
      console.error('Socket error:', error);
    };

    // Handle online status updates
    const handleOnlineUsersList = (users) => {
      const usersMap = new Map(users.map(u => [u.userId, u]));
      setOnlineUsers(usersMap);
      
      // Check if patient is online
      if (appointment && appointment.patient_id) {
        setOtherUserOnline(usersMap.has(appointment.patient_id));
      }
    };

    const handleUserStatusChange = (data) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        if (data.status === 'online') {
          newMap.set(data.userId, data);
        } else {
          newMap.delete(data.userId);
        }
        
        // Check if patient status changed
        if (appointment && appointment.patient_id === data.userId) {
          setOtherUserOnline(data.status === 'online');
        }
        
        return newMap;
      });
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('appointment_update', handleAppointmentUpdate);
    socket.on('online_users_list', handleOnlineUsersList);
    socket.on('user_status_change', handleUserStatusChange);
    socket.on('error', handleError);
    
    return () => {
      try { 
        socket.emit('leave_appointment', appointmentId); 
      } catch (err) { 
        console.log('Leave appointment error:', err); 
      }
    socket.off('receive-message', handleReceiveMessage);
    socket.off('messages_read', handleMessagesRead);
    socket.off('appointment_update', handleAppointmentUpdate);
    socket.off('online_users_list', handleOnlineUsersList);
    socket.off('user_status_change', handleUserStatusChange);
    socket.off('error', handleError);
    };
  }, [socket, isConnected, appointmentId, user.id, appointment?.patient_id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const send = () => {
    if (!text.trim() || !socket || !isConnected || appointment?.status === 'completed') return;
    
    const payload = { 
      appointmentId, 
      senderId: user.id, 
      content: text.trim(), 
      messageType: 'text' 
    };
    
    console.log('Counselor sending message:', payload);
    socket.emit('send-message', payload);
    setText('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'vi-VN';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setText(prev => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error !== 'no-speech') {
          alert('Lỗi nhận dạng giọng nói: ' + event.error);
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      // Cleanup speech recognition
      if (recognitionRef.current && isRecording) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Speech recognition cleanup error:', e);
        }
      }
    };
  }, [isRecording]);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsRecording(false);
      }
    }
  };

  const handleEmojiSelect = (emoji) => {
    setText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const updateAppointmentStatus = async (status) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status });
      setAppointment(prev => ({ ...prev, status }));
      alert('Cập nhật trạng thái thành công');
    } catch (err) {
      alert('Cập nhật trạng thái thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    listRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="text-gray-600 text-lg font-medium">Đang tải phòng chat...</div>
            <div className="text-gray-500 text-sm mt-2">Vui lòng chờ trong giây lát</div>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-600 mb-2">Không tìm thấy lịch hẹn</h3>
              <p className="text-gray-600 mb-6">Lịch hẹn không tồn tại hoặc đã bị xóa</p>
              <button 
                onClick={() => navigate('/counselor/schedule')}
                className="bg-gradient-to-r from-slate-500 to-slate-600 text-white px-6 py-3 rounded-lg hover:from-slate-600 hover:to-slate-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                ← Quay lại lịch làm việc
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-slate-600 via-gray-600 to-blue-600 p-8 rounded-2xl text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2 flex items-center">
                  {appointment.is_anonymous ? 'Tư vấn trực tuyến (Ẩn danh)' : 'Tư vấn trực tuyến'}
                </h1>
                <p className="text-gray-100 text-xl mb-4">
                  Với {appointment.patient_name} - {formatDate(appointment.appointment_date)} lúc {appointment.appointment_time}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30`}>
                    {appointment.appointment_type === 'online' ? 'Trực tuyến' : 'Tại phòng khám'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30`}>
                    {appointment.status === 'confirmed' ? 'Đã xác nhận' :
                     appointment.status === 'in_progress' ? 'Đang diễn ra' :
                     appointment.status === 'completed' ? 'Hoàn thành' :
                     appointment.status === 'cancelled' ? 'Đã hủy' : 'Chờ xác nhận'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {appointment.status === 'confirmed' && (
                  <button
                    onClick={() => updateAppointmentStatus('in_progress')}
                    className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                  >
                    Bắt đầu tư vấn
                  </button>
                )}
                {appointment.status === 'in_progress' && (
                  <button
                    onClick={() => updateAppointmentStatus('completed')}
                    className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                  >
                    Hoàn thành tư vấn
                  </button>
                )}
                <button
                  onClick={() => navigate('/counselor/schedule')}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-all duration-200 font-medium flex items-center justify-center"
                >
                  ← Quay lại
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col h-[600px] overflow-hidden">
          {/* Connection Status */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {isConnected ? 'Kết nối ổn định' : 'Đang kết nối lại...'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {/* Online Status of Patient */}
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${otherUserOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-xs text-gray-600 font-medium">
                    {appointment?.patient_name} {otherUserOnline ? 'Đang online' : 'Offline'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Chat trực tuyến
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Bắt đầu cuộc trò chuyện</h3>
                <p className="text-gray-500">Chưa có tin nhắn nào. Hãy gửi tin nhắn đầu tiên!</p>
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-3 max-w-xs lg:max-w-md ${message.sender_id === user.id ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      message.sender_id === user.id 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                        : 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'
                    }`}>
                      {message.sender_name?.charAt(0) || '?'}
                    </div>
                    
                    {/* Message bubble */}
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm ${
                        message.sender_id === user.id
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm'
                          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                      }`}
                    >
                      <div className="text-xs font-medium opacity-70 mb-1">
                        {message.sender_name}
                      </div>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                      <div className={`text-xs mt-2 flex items-center gap-1 ${
                        message.sender_id === user.id ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(message.created_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {/* Message status - only show for sender's messages */}
                        {message.sender_id === user.id && (
                          <span className="ml-2 flex items-center gap-0.5">
                            {message.is_read ? (
                              <>
                                <svg className="w-3.5 h-3.5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                <svg className="w-3.5 h-3.5 -ml-2 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              </>
                            ) : (
                              <svg className="w-3.5 h-3.5 text-blue-200 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={listRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-gray-200 bg-white">
            {appointment?.status === 'completed' ? (
              <div className="flex items-center justify-center py-4">
                <div className="bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-medium">
                  Buổi tư vấn đã kết thúc
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2 md:gap-3 items-end">
                  {/* Emoji Picker Button */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEmojiPicker(!showEmojiPicker);
                      }}
                      disabled={!isConnected}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Chọn emoji"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {showEmojiPicker && (
                      <EmojiPicker 
                        onEmojiSelect={handleEmojiSelect}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    )}
                  </div>

                  {/* Voice Input Button */}
                  <button
                    onClick={toggleVoiceRecording}
                    disabled={!isConnected}
                    className={`p-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isRecording 
                        ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                    title={isRecording ? 'Đang ghi âm...' : 'Nhập bằng giọng nói'}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>

                  {/* Text Input */}
                  <div className="flex-1 relative">
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isRecording ? "Đang nghe..." : "Nhập tin nhắn tư vấn..."}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-400"
                      disabled={!isConnected || isRecording}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {isRecording ? (
                        <div className="flex gap-1">
                          <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse"></span>
                          <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                          <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={send}
                    disabled={!text.trim() || !isConnected}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 md:px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span className="hidden md:inline">Gửi</span>
                  </button>
                </div>
                
                {/* Status messages */}
                {isRecording && (
                  <div className="text-xs text-red-500 flex items-center justify-center gap-2 animate-pulse">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    <span className="font-medium">Đang ghi âm... Hãy nói vào micro</span>
                  </div>
                )}
                
                {/* Connection status in input area */}
                {!isConnected && (
                  <div className="text-xs text-red-500 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="animate-pulse">Mất kết nối - Đang thử kết nối lại...</span>
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
    </div>
    </div>
  );
}
