import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

export default function AIAdvisor({ open, onClose, onSuggestFilters }) {
  const SESSION_KEY = 'ai_advisor_session_v1';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const bottomRef = useRef(null);

  // Tạo session ID mới
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Tạo tiêu đề cho session từ tin nhắn đầu tiên của user
  const getSessionTitle = (messages) => {
    if (!messages || messages.length === 0) return 'Cuộc trò chuyện mới';
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (!firstUserMsg) return 'Cuộc trò chuyện mới';
    const text = firstUserMsg.content.substring(0, 40);
    return text.length < firstUserMsg.content.length ? `${text}...` : text;
  };

  // Lấy lịch sử chat từ localStorage (không dùng server)
  const loadChatHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      // Load từ localStorage
      const savedHistory = localStorage.getItem('ai_chat_sessions');
      if (savedHistory) {
        const sessions = JSON.parse(savedHistory);
        setChatHistory(sessions.slice(0, 10)); // Giới hạn 10 session gần nhất
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử chat:', error);
      setChatHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Load session cụ thể
  const loadSession = useCallback((session) => {
    if (!session || !session.messages || !Array.isArray(session.messages)) return;
    
    // Load messages của session
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setSuggestions([]);
    setQuickReplies([
      'Tôi đang lo âu',
      'Tôi mất ngủ',
      'Vấn đề trong mối quan hệ',
      'Stress công việc'
    ]);
    setShowHistory(false);
  }, []);

  // Lưu session vào localStorage
  const saveSessionToHistory = useCallback((sessionData) => {
    try {
      // Load lịch sử hiện tại
      const savedHistory = localStorage.getItem('ai_chat_sessions');
      let sessions = savedHistory ? JSON.parse(savedHistory) : [];
      
      // Loại bỏ session cũ có cùng ID (nếu có)
      sessions = sessions.filter(s => s.id !== sessionData.id);
      
      // Thêm session mới vào đầu
      sessions.unshift(sessionData);
      
      // Giới hạn 10 sessions gần nhất
      sessions = sessions.slice(0, 10);
      
      // Lưu vào localStorage
      localStorage.setItem('ai_chat_sessions', JSON.stringify(sessions));
      
      // Cập nhật state
      setChatHistory(sessions);
    } catch (error) {
      console.error('Lỗi khi lưu session:', error);
    }
  }, []);

  // Xóa lịch sử chat
  const clearHistory = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử chat?')) return;
    
    try {
      localStorage.removeItem('ai_chat_sessions');
      setChatHistory([]);
      alert('Đã xóa lịch sử chat thành công');
    } catch (error) {
      console.error('Lỗi khi xóa lịch sử:', error);
      alert('Có lỗi xảy ra khi xóa lịch sử');
    }
  };

  // Lưu phiên hiện tại khi đóng chat
  const handleClose = useCallback(() => {
    // Lưu phiên hiện tại vào lịch sử nếu có tin nhắn từ user
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const sessionData = {
        id: currentSessionId || generateSessionId(),
        title: getSessionTitle(messages),
        messages: messages,
        lastMessage: new Date().toISOString(),
        messageCount: userMessages.length
      };
      
      saveSessionToHistory(sessionData);
    }
    
    onClose();
  }, [messages, currentSessionId, saveSessionToHistory, onClose]);

  // Fix mojibake (UTF-8 shown as Latin1) if it sneaks in from server
  const fixVN = (s) => {
    try {
      const str = String(s || '');
      if (!/[ÃÂ�]/.test(str)) return str; // fast path
      // Decode by interpreting current chars as Latin1 bytes -> UTF-8
      const bytes = new Uint8Array([...str].map(ch => ch.charCodeAt(0) & 0xff));
      return new TextDecoder('utf-8').decode(bytes);
    } catch { return s; }
  };

  // Reset chat và lưu phiên hiện tại vào lịch sử
  const reset = useCallback(() => {
    // Lưu phiên hiện tại vào lịch sử trước khi reset (nếu có tin nhắn từ user)
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const sessionData = {
        id: currentSessionId || generateSessionId(),
        title: getSessionTitle(messages),
        messages: messages,
        lastMessage: new Date().toISOString(),
        messageCount: userMessages.length
      };
      
      saveSessionToHistory(sessionData);
    }

    // Tạo session mới
    const newSessionId = generateSessionId();
    setMessages([
      {
        role: 'assistant',
        content:
          'Xin chào! 👋 Mình là trợ lý AI về sức khỏe tinh thần.\n\nBạn có thể chia sẻ với mình:\n• Cảm xúc bạn đang trải qua\n• Vấn đề bạn đang gặp phải\n• Loại hỗ trợ bạn cần\n\nMình sẽ lắng nghe và gợi ý chuyên gia phù hợp nhất cho bạn! 💚'
      }
    ]);
    setInput('');
    setSuggestions([]);
    setCurrentSessionId(newSessionId);
    setQuickReplies([
      'Tôi đang lo âu',
      'Tôi mất ngủ',
      'Vấn đề trong mối quan hệ',
      'Stress công việc'
    ]);
  }, [messages, currentSessionId, saveSessionToHistory]);

  // Bắt bộ lọc từ nội dung (không phân biệt dấu)
  const detectFilters = (text) => {
    const raw = String(text || '');
    const t = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const f = {};
    if (/(lo\s*au|anxiety|stress|cang\s*thang)/.test(t)) f.specialtyName = 'Lo âu';
    if (/(tram\s*cam|depress)/.test(t)) f.specialtyName = 'Trầm cảm';
    if (/(moi\s*quan\s*he|relationship|hon\s*nhan|gia\s*dinh)/.test(t)) f.specialtyName = 'Quan hệ - Gia đình';
    if (/(giac\s*ngu|insomnia|mat\s*ngu)/.test(t)) f.specialtyName = 'Giấc ngủ';
    if (/(cong\s*viec|work|nghe\s*nghiep)/.test(t)) f.specialtyName = 'Công việc';
    if (/(tam\s*ly\s*suc\s*khoe|suc\s*khoe\s*tam\s*ly|suc\s*khoe\s*tinh\s*than)/.test(t)) f.specialtyName = 'Tâm lý sức khỏe';
    if (/(>\s*5|5\+|\b5\b|kinh\s*nghiem\s*cao)/.test(t)) f.minYears = 5;
    if (/(\bnam\b|male)/.test(t)) f.gender = 'male';
    if (/(\bnu\b|nữ|female)/.test(raw.toLowerCase())) f.gender = 'female';
    return f;
  };

  // Load lịch sử khi mở chat lần đầu
  useEffect(() => {
    if (open) {
      loadChatHistory();
    }
  }, [open, loadChatHistory]);

  // Khôi phục phiên từ sessionStorage khi component mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setMessages(s.messages || []);
        setSuggestions(s.suggestions || []);
        setQuickReplies(s.quickReplies || []);
        setCurrentSessionId(s.currentSessionId || generateSessionId());
      } else {
        // Tạo session mới nếu chưa có
        const newSessionId = generateSessionId();
        setCurrentSessionId(newSessionId);
        setMessages([
          {
            role: 'assistant',
            content:
              'Xin chào! 👋 Mình là trợ lý AI về sức khỏe tinh thần.\n\nBạn có thể chia sẻ với mình:\n• Cảm xúc bạn đang trải qua\n• Vấn đề bạn đang gặp phải\n• Loại hỗ trợ bạn cần\n\nMình sẽ lắng nghe và gợi ý chuyên gia phù hợp nhất cho bạn! 💚'
          }
        ]);
      }
    } catch {
      const newSessionId = generateSessionId();
      setCurrentSessionId(newSessionId);
      setMessages([
        {
          role: 'assistant',
          content:
            'Xin chào! 👋 Mình là trợ lý AI về sức khỏe tinh thần.\n\nBạn có thể chia sẻ với mình:\n• Cảm xúc bạn đang trải qua\n• Vấn đề bạn đang gặp phải\n• Loại hỗ trợ bạn cần\n\nMình sẽ lắng nghe và gợi ý chuyên gia phù hợp nhất cho bạn! 💚'
        }
      ]);
    }
  }, []);

  // Lưu phiên hiện tại vào sessionStorage (không lưu chatHistory)
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ 
        messages, 
        suggestions, 
        quickReplies, 
        currentSessionId
      }));
    } catch (error) {
      console.error('Không thể lưu phiên:', error);
    }
  }, [messages, suggestions, quickReplies, currentSessionId]);

  // Cuộn xuống cuối khi có nội dung mới
  useEffect(() => {
    const t = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    return () => clearTimeout(t);
  }, [messages, suggestions, typing]);

  const sendMessage = async (text) => {
    const content = String(text || '').trim();
    if (!content || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content }]);
    setInput('');
    setLoading(true);
    setTyping(true);
    setQuickReplies([]);
    setSuggestions([]);

    try {
      // Gọi API với context từ 3 tin nhắn gần nhất
      const recentContext = messages
        .slice(-6) // Lấy 3 cặp hội thoại gần nhất
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const res = await api.post('/ai/chat', { 
        message: content,
        context: recentContext 
      });

      // Xử lý phản hồi từ AI
      const botMsgs = (res.data?.messages || []).map((m) => ({ 
        role: m.role, 
        content: fixVN(m.content) 
      }));
      
      if (botMsgs.length) {
        setMessages((prev) => [...prev, ...botMsgs]);
      }

      // Cập nhật quick replies
      if (Array.isArray(res.data?.quickReplies)) {
        setQuickReplies(res.data.quickReplies.map(fixVN));
      }

      // Xử lý gợi ý chuyên gia
      let recs = [];
      if (Array.isArray(res.data?.suggestions)) {
        recs = res.data.suggestions;
      } else if (Array.isArray(res.data?.recommendations)) {
        recs = res.data.recommendations.map((c) => ({ 
          counselor: c.counselor || c, 
          slots: c.slots || [],
          match_reason: c.match_reason || 'Phù hợp với nhu cầu của bạn'
        }));
      } else if (Array.isArray(res.data?.counselors)) {
        recs = res.data.counselors.map((c) => ({ 
          counselor: c, 
          slots: [],
          match_reason: 'Gợi ý cho bạn'
        }));
      }

      // Áp dụng bộ lọc nếu có
      const local = detectFilters(content);
      if (local.specialtyName && Array.isArray(recs)) {
        const target = local.specialtyName.toLowerCase();
        const filtered = recs.filter(r => 
          String(r.counselor?.specialty_name || '').toLowerCase().includes(target)
        );
        if (filtered.length) recs = filtered;
      }

      setSuggestions(recs || []);

      // Gợi ý bộ lọc nếu có callback
      if (Object.keys(local).length && typeof onSuggestFilters === 'function') {
        onSuggestFilters(local);
      }

    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      setMessages((prev) => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Xin lỗi, hiện tại mình gặp trục trặc kỹ thuật. Vui lòng thử lại sau hoặc liên hệ trực tiếp với chuyên gia.' 
        }
      ]);
    } finally {
      setTyping(false);
      setLoading(false);
    }
  };

  const handleFindBySuggestion = () => {
    let f = {};
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      const top = suggestions[0]?.counselor;
      if (top?.specialty_name) f.specialtyName = top.specialty_name;
    }
    if (!Object.keys(f).length) {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUser) f = detectFilters(lastUser.content);
    }
    if (Object.keys(f).length && typeof onSuggestFilters === 'function') onSuggestFilters(f);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative w-full max-w-6xl mx-4 my-6">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 md:h-[80vh] max-h-[85vh] flex">
          
          {/* Sidebar lịch sử chat */}
          <div className={`${showHistory ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 bg-gray-50`}>
            <div className="h-full flex flex-col">
              {/* Header sidebar */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 text-sm">Lịch sử trò chuyện</h3>
                  <button 
                    onClick={clearHistory}
                    className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                    title="Xóa tất cả lịch sử"
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>

              {/* Danh sách lịch sử */}
              <div className="flex-1 overflow-y-auto p-2">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : chatHistory.length > 0 ? (
                  <div className="space-y-2">
                    {chatHistory.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => loadSession(session)}
                        className={`p-3 rounded-lg cursor-pointer border transition-all ${
                          currentSessionId === session.id 
                            ? 'bg-cyan-100 border-cyan-300' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">
                          {session.title}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center justify-between">
                          <span>{session.messageCount} tin nhắn</span>
                          <span>{new Date(session.lastMessage).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Chưa có lịch sử trò chuyện
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-white to-emerald-50/50">
              <div className="flex items-center gap-3">
                {/* Toggle history button */}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 flex items-center justify-center transition-colors"
                  title={showHistory ? "Ẩn lịch sử" : "Xem lịch sử"}
                >
                  {showHistory ? '←' : '≡'}
                </button>
                
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white grid place-items-center font-bold shadow-lg">AI</div>
                <div>
                  <div className="text-base font-bold text-gray-800">MindCare AI</div>
                  <div className="text-xs text-cyan-600 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                    Đang hoạt động • Hỗ trợ 24/7
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleFindBySuggestion} className="px-3 py-2 rounded-lg bg-cyan-400 text-white text-sm hover:bg-cyan-500 shadow-sm transition-colors font-medium">Tìm chuyên gia</button>
                <button onClick={handleClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 flex items-center justify-center transition-colors" aria-label="Đóng">×</button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] md:max-w-[70%] px-4 py-2 rounded-2xl shadow ${m.role === 'user' ? 'bg-cyan-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-700 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-cyan-200">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center font-bold">AI</div>
                      <div className="text-sm flex items-center">
                        Đang soạn trả lời
                        <span className="ml-1 inline-flex items-center">
                          <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full" style={{ animation: 'mc-typing 1.2s infinite ease-in-out', animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full ml-1" style={{ animation: 'mc-typing 1.2s infinite ease-in-out', animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full ml-1" style={{ animation: 'mc-typing 1.2s infinite ease-in-out', animationDelay: '300ms' }}></span>
                        </span>
                      </div>
                    </div>
                    <style>{`@keyframes mc-typing{0%,80%,100%{transform:translateY(0);opacity:.3}40%{transform:translateY(-3px);opacity:1}}`}</style>
                  </div>
                </div>
              )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-2 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-sm font-semibold text-gray-700">
                    ✨ {suggestions.length} chuyên gia phù hợp với bạn
                  </div>
                </div>
                {suggestions.map((sug, i) => {
                  const counselor = sug.counselor;
                  return (
                    <div key={i} className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="shrink-0">
                            {counselor?.avatar_url ? (
                              <img 
                                src={(() => {
                                  const url = counselor.avatar_url;
                                  if (url.startsWith('http://') || url.startsWith('https://')) return url;
                                  const base = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api','') : 'http://localhost:5000';
                                  return base + (url.startsWith('/') ? url : '/' + url);
                                })()} 
                                alt={counselor.full_name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-cyan-100"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-xl font-bold"
                              style={{ display: counselor?.avatar_url ? 'none' : 'flex' }}
                            >
                              {counselor?.full_name?.charAt(0) || '?'}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="font-bold text-gray-900 text-base mb-1">
                                  {counselor?.full_name}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                                    {counselor?.specialty_name || 'Tâm lý học'}
                                  </span>
                                  {counselor?.gender && (
                                    <span className="text-xs text-gray-500">
                                      {counselor.gender === 'male' ? '👨‍⚕️' : '👩‍⚕️'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Link 
                                to={`/patient/counselor/${counselor?.user_id}`} 
                                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 text-white text-xs hover:bg-cyan-600 transition-colors font-medium shadow-sm"
                              >
                                Xem hồ sơ →
                              </Link>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">📚</span>
                                <span>{counselor?.experience_years || 0} năm KN</span>
                              </div>
                              {counselor?.avg_rating && (
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-500">⭐</span>
                                  <span className="font-medium">{counselor.avg_rating}</span>
                                  <span className="text-gray-400">({counselor.review_count || 0})</span>
                                </div>
                              )}
                              {counselor?.online_price && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">💰</span>
                                  <span>{Number(counselor.online_price).toLocaleString('vi-VN')}₫</span>
                                </div>
                              )}
                            </div>

                            {/* Match reason */}
                            {sug.match_reason && (
                              <div className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-2 py-1 inline-block">
                                ✓ {sug.match_reason}
                              </div>
                            )}

                            {/* Bio preview */}
                            {counselor?.bio && (
                              <div className="text-xs text-gray-600 mt-2 line-clamp-2">
                                {counselor.bio}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

              <div ref={bottomRef} />
            </div>

            {/* Footer */}
            <div className="p-3 border-t space-y-2 bg-white">
              {quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((q) => (
                    <button key={q} className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm transition" onClick={() => sendMessage(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(input);
                      }
                    }}
                    placeholder="Chia sẻ điều bạn đang gặp..."
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-50 disabled:text-gray-400 transition-all"
                    disabled={loading}
                  />
                  {input.trim() && (
                    <button onClick={() => setInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Xóa">×</button>
                  )}
                </div>
                <button
                  disabled={loading || !input.trim()}
                  onClick={() => sendMessage(input)}
                  className="px-5 py-3 rounded-xl bg-cyan-400 text-white disabled:opacity-50 hover:bg-cyan-500 transition-all font-medium shadow-sm disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang gửi...
                    </>
                  ) : (
                    <>Gửi</>
                  )}
                </button>
                <button onClick={reset} className="px-3 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors" title="Làm mới cuộc trò chuyện">↺</button>
              </div>
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-amber-600 text-lg">!</div>
                <div className="text-xs text-amber-800">
                  Lưu ý: Đây là trợ lý AI, không thay thế ý kiến chuyên gia. Trường hợp khẩn cấp hãy gọi 115 hoặc đến cơ sở y tế gần nhất.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
