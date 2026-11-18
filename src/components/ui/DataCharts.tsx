import React, { useState } from 'react';

export interface BarChartDatum {
  label: string;
  primary: number;
  secondary?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export const InteractiveBarChart: React.FC<{
  data: BarChartDatum[];
  primaryColor?: string;
  secondaryColor?: string;
  primaryName?: string;
  secondaryName?: string;
  valueFormatter?: (v: number) => string;
  height?: number;
}> = ({
  data,
  primaryColor = '#3B82F6',
  secondaryColor = '#14B8A6',
  primaryName = 'Primary',
  secondaryName = 'Secondary',
  valueFormatter = (v) => v.toString(),
  height = 220,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-44 text-xs text-slate-500">
        No chart data available for current filter.
      </div>
    );
  }

  const maxVal = Math.max(
    1,
    ...data.map((d) => Math.max(d.primary, d.secondary ?? 0))
  );

  const hasSecondary = data.some((d) => d.secondary !== undefined);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 min-h-[20px]">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs inline-block" style={{ backgroundColor: primaryColor }} />
            {primaryName}
          </span>
          {hasSecondary && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs inline-block" style={{ backgroundColor: secondaryColor }} />
              {secondaryName}
            </span>
          )}
        </div>
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="text-xs font-mono tabular-nums text-slate-100 font-medium">
            {data[hoveredIdx].label}: {valueFormatter(data[hoveredIdx].primary)}
            {hasSecondary && data[hoveredIdx].secondary !== undefined
              ? ` · ${valueFormatter(data[hoveredIdx].secondary!)}`
              : ''}
          </div>
        )}
      </div>

      <div
        className="relative flex items-end gap-2 sm:gap-3 pt-4 pb-6 border-b border-[#1E2E4E]"
        style={{ height }}
      >
        {[0.25, 0.5, 0.75, 1].map((step) => (
          <div
            key={step}
            className="absolute left-0 right-0 border-t border-dashed border-[#172540] pointer-events-none flex items-center"
            style={{ bottom: `${24 + step * (height - 44)}px` }}
          >
            <span className="text-[10px] font-mono tabular-nums text-slate-500 -mt-3.5 select-none">
              {valueFormatter(Math.round(maxVal * step))}
            </span>
          </div>
        ))}

        {data.map((d, idx) => {
          const pHeight = Math.max(4, Math.round((d.primary / maxVal) * (height - 52)));
          const sHeight =
            d.secondary !== undefined
              ? Math.max(4, Math.round((d.secondary / maxVal) * (height - 52)))
              : 0;
          const active = hoveredIdx === idx;

          return (
            <div
              key={d.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
            >
              <div className="flex items-end gap-1 w-full justify-center z-10">
                <div
                  className="w-3 sm:w-5 rounded-t-sm transition-all duration-150"
                  style={{
                    height: `${pHeight}px`,
                    backgroundColor: primaryColor,
                    opacity: hoveredIdx !== null && !active ? 0.45 : 1,
                  }}
                />
                {hasSecondary && d.secondary !== undefined && (
                  <div
                    className="w-3 sm:w-5 rounded-t-sm transition-all duration-150"
                    style={{
                      height: `${sHeight}px`,
                      backgroundColor: secondaryColor,
                      opacity: hoveredIdx !== null && !active ? 0.45 : 1,
                    }}
                  />
                )}
              </div>
              <span
                className={`absolute -bottom-5 text-[11px] truncate max-w-full transition-colors ${
                  active ? 'text-slate-100 font-semibold' : 'text-slate-400'
                }`}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface TrendPoint {
  label: string;
  primary: number;
  secondary?: number;
}

export const InteractiveAreaTrendChart: React.FC<{
  data: TrendPoint[];
  primaryName: string;
  secondaryName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  valueFormatter?: (v: number) => string;
  height?: number;
}> = ({
  data,
  primaryName,
  secondaryName,
  primaryColor = '#38BDF8',
  secondaryColor = '#14B8A6',
  valueFormatter = (v) => String(v),
  height = 200,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-44 text-xs text-slate-500">
        Insufficient data points for trend visualization.
      </div>
    );
  }

  const width = 640;
  const padX = 28;
  const padTop = 18;
  const padBottom = 26;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(
    1,
    ...data.map((d) => Math.max(d.primary, d.secondary ?? 0))
  );

  const hasSecondary = data.some((d) => d.secondary !== undefined);

  const getCoords = (idx: number, val: number) => {
    const x = padX + (idx / (data.length - 1)) * plotW;
    const y = padTop + plotH - (val / maxVal) * plotH;
    return { x, y };
  };

  const primaryPoints = data.map((d, i) => getCoords(i, d.primary));
  const primaryPath = primaryPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const primaryArea = `${primaryPath} L ${primaryPoints[primaryPoints.length - 1].x.toFixed(
    1
  )} ${(padTop + plotH).toFixed(1)} L ${primaryPoints[0].x.toFixed(1)} ${(
    padTop + plotH
  ).toFixed(1)} Z`;

  const secondaryPoints = hasSecondary
    ? data.map((d, i) => getCoords(i, d.secondary ?? 0))
    : [];
  const secondaryPath = secondaryPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 min-h-[20px]">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: primaryColor }} />
            {primaryName}
          </span>
          {hasSecondary && secondaryName && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: secondaryColor }} />
              {secondaryName}
            </span>
          )}
        </div>
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="text-xs font-mono tabular-nums text-slate-100 font-medium">
            {data[hoveredIdx].label}: {valueFormatter(data[hoveredIdx].primary)}
            {hasSecondary && data[hoveredIdx].secondary !== undefined
              ? ` · ${valueFormatter(data[hoveredIdx].secondary!)}`
              : ''}
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible select-none"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="finSightAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((step) => {
          const y = padTop + plotH - step * plotH;
          return (
            <line
              key={step}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="#1B2B4B"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          );
        })}

        <path d={primaryArea} fill="url(#finSightAreaGrad)" />
        <path
          d={primaryPath}
          fill="none"
          stroke={primaryColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {hasSecondary && (
          <path
            d={secondaryPath}
            fill="none"
            stroke={secondaryColor}
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {hoveredIdx !== null && (
          <line
            x1={primaryPoints[hoveredIdx].x}
            x2={primaryPoints[hoveredIdx].x}
            y1={padTop}
            y2={padTop + plotH}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        )}

        {data.map((d, idx) => {
          const p = primaryPoints[idx];
          const s = secondaryPoints[idx];
          const active = hoveredIdx === idx;
          return (
            <g
              key={d.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              className="cursor-pointer"
            >
              <rect
                x={p.x - plotW / data.length / 2}
                y={padTop}
                width={plotW / data.length}
                height={plotH + padBottom}
                fill="transparent"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={active ? 5 : 3.2}
                fill="#0B1426"
                stroke={primaryColor}
                strokeWidth="2.2"
              />
              {s && (
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={active ? 4.5 : 2.8}
                  fill="#0B1426"
                  stroke={secondaryColor}
                  strokeWidth="2"
                />
              )}
              <text
                x={p.x}
                y={height - 6}
                textAnchor="middle"
                className="text-[11px] fill-slate-400 font-sans"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export const DonutBreakdownChart: React.FC<{
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
  valueFormatter?: (v: number) => string;
}> = ({ segments, centerLabel, centerValue, valueFormatter = (v) => String(v) }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke="#15233E"
            strokeWidth="16"
          />
          {total > 0 &&
            segments.map((seg) => {
              const pct = seg.value / total;
              const dash = pct * circumference;
              const offset = -cumulative * circumference;
              cumulative += pct;
              return (
                <circle
                  key={seg.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={hovered === seg.label ? 19 : 16}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHovered(seg.label)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-lg font-bold font-mono tabular-nums text-slate-100">
            {centerValue ?? total}
          </span>
          {centerLabel && <span className="text-[11px] text-slate-400">{centerLabel}</span>}
        </div>
      </div>

      <div className="flex-1 w-full space-y-2">
        {segments.map((seg) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div
              key={seg.label}
              onMouseEnter={() => setHovered(seg.label)}
              onMouseLeave={() => setHovered(null)}
              className="flex items-center justify-between text-xs py-1 border-b border-[#192845] last:border-b-0 cursor-default"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-slate-300 truncate">{seg.label}</span>
              </div>
              <div className="font-mono tabular-nums text-slate-100 font-medium shrink-0 ml-3">
                {valueFormatter(seg.value)}{' '}
                <span className="text-slate-500 font-normal">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
