import React from 'react';

export default function AdminPage({ title, subtitle, actions, children, className = "" }){
  return (
    <div className={`w-full px-4 py-6 ${className}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section - Only show if title or actions provided */}
        {(title || actions) && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {title && (
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {title}
                    </h2>
                  </div>
                  {subtitle && (
                    <p className="text-gray-600 text-base font-medium ml-13">{subtitle}</p>
                  )}
                </div>
              )}
              {actions && (
                <div className="flex items-center gap-3 flex-wrap">
                  {actions}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}



