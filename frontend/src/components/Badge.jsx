import React from 'react';

export default function Badge({ color = 'gray', children, className = '' }) {
  const colorMap = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    emerald: 'bg-emerald-100 text-emerald-800',
  };

  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${colorMap[color] || colorMap.gray} ${className}`}>
      {children}
    </span>
  );
}



