import React from 'react';

export default function UserPage({ title, subtitle, action, children }) {
  return (
    <div className="w-full bg-gradient-to-b from-emerald-50/60 via-white to-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {(title || subtitle || action) && (
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                {title && (
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-gray-600 mt-1">{subtitle}</p>
                )}
              </div>
              {action && <div className="shrink-0">{action}</div>}
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}





