import React from 'react';
import { Link } from 'react-router-dom';

export default function StatCard({
  title,
  value,
  hint,
  icon, // React node
  to, // optional link
  accentClass = 'from-blue-500 to-blue-600',
}) {
  const Wrapper = to ? Link : 'div';
  const wrapProps = to ? { to } : {};
  return (
    <Wrapper
      {...wrapProps}
      className={`group bg-white p-4 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 ${
        to ? 'hover:-translate-y-0.5 cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1.5 leading-none">{value}</div>
          {hint && <div className="text-xs text-gray-600 mt-1 truncate">{hint}</div>}
        </div>
        <div
          className={`w-11 h-11 bg-gradient-to-br ${accentClass} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
    </Wrapper>
  );
}

