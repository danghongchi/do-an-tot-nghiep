import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIAdvisor from './AIAdvisor';
import { useAuth } from '../contexts/AuthContext';

export default function FloatingChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ai_widget_state');
      if (raw) {
        const s = JSON.parse(raw);
        setOpen(!!s.open);
        setMinimized(s.minimized !== false);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('ai_widget_state', JSON.stringify({ open, minimized })); } catch {}
  }, [open, minimized]);

  if (!minimized && !open) setOpen(true);

  // Chỉ hiển thị cho user có role 'user' hoặc chưa đăng nhập
  if (user && user.role !== 'user') {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        {/* FAB */}
        {!open && (
          <button
            aria-label="Mở trợ lý tư vấn"
            onClick={() => setOpen(true)}
            className="rounded-full w-14 h-14 bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl text-white flex items-center justify-center transition-all duration-300 group relative"
          >
            <svg 
              className="w-6 h-6 text-white group-hover:scale-110 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
            {/* Pulse effect */}
            <div className="absolute inset-0 rounded-full bg-emerald-600 animate-ping opacity-20"></div>
          </button>
        )}
      </div>

      {/* Advisor Modal */}
      {open && (
        <AIAdvisor
          open={open}
          onClose={() => setOpen(false)}
          onSuggestFilters={(filters)=>{
            try { sessionStorage.setItem('counselor_list_prefilters', JSON.stringify(filters||{})); } catch {}
            navigate('/patient/counselors?init=advisor');
          }}
        />
      )}
    </>
  );
}




