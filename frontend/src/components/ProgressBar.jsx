import React from 'react';

export default function ProgressBar({
  value = 0, // 0..100
  label,
  count,
  trackClass = 'bg-gray-200',
  barClass = 'bg-gradient-to-r from-blue-500 to-indigo-500',
  heightClass = 'h-3',
  widthClass = 'w-full max-w-[280px] sm:max-w-[360px] md:max-w-[420px] lg:max-w-[480px]'
}) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="flex items-center gap-3">
      <div
        className={`${widthClass} ${trackClass} rounded-full ${heightClass}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v)}
        aria-label={label || 'progress'}
      >
        <div
          className={`${barClass} ${heightClass} rounded-full transition-all duration-700`}
          style={{ width: `${v}%` }}
          aria-hidden="true"
        />
      </div>
      {count !== undefined && (
        <span className="text-lg font-bold text-gray-900">{count}</span>
      )}
    </div>
  );
}
