import React from 'react';

export default function RevenueChart({ points = [], height = 140 }) {
  const h = height;
  const w = Math.max(240, points.length * 56);
  const maxVal = Math.max(1, ...points.map(p => Number(p.value) || 0));
  const pad = 12;
  const innerH = h - pad * 2;
  const innerW = w - pad * 2;

  const coords = points.map((p, i) => {
    const x = pad + (i / Math.max(1, points.length - 1)) * innerW;
    const y = pad + (1 - (Number(p.value) || 0) / maxVal) * innerH;
    return { x, y };
  });

  const areaPath = (() => {
    if (coords.length === 0) return '';
    const top = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
    const bottom = `L${pad + innerW},${pad + innerH} L${pad},${pad + innerH} Z`;
    return `${top} ${bottom}`;
  })();

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i} x1={pad} x2={pad + innerW} y1={pad + t * innerH} y2={pad + t * innerH} stroke="#e5e7eb" strokeWidth="1" />
        ))}

        {/* Area */}
        {areaPath && (
          <path d={areaPath} fill="url(#revFill)" />
        )}

        {/* Line */}
        {linePath && (
          <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" />
        )}

        {/* Dots */}
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={3} fill="#10b981" />
        ))}

        {/* Labels */}
        {points.map((p, i) => (
          <text key={i} x={coords[i]?.x || 0} y={h - 2} textAnchor="middle" fontSize="11" fill="#6b7280">
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

