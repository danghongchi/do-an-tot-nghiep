import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((message, options = {}) => {
    const id = ++counterRef.current;
    const toast = {
      id,
      title: options.title || 'Thông báo',
      message: typeof message === 'string' ? message : (options.message || ''),
      type: options.type || 'info',
      duration: options.duration || 4000
    };
    setToasts(prev => [toast, ...prev].slice(0, 5));
    if (toast.duration > 0) {
      setTimeout(() => remove(id), toast.duration);
    }
  }, [remove]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 right-4 z-[1000] space-y-2 w-[90vw] max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`rounded-lg shadow-lg border px-4 py-3 bg-white/95 backdrop-blur ${
            t.type === 'success' ? 'border-emerald-200' : t.type === 'error' ? 'border-red-200' : 'border-gray-200'
          }`}>
            <div className="text-sm font-semibold text-gray-900">{t.title}</div>
            {t.message && <div className="text-xs text-gray-600 mt-1">{t.message}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);



