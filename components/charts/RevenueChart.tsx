'use client';

interface DataPoint {
  month: string;
  revenue: number;
  expense: number;
}

interface Props {
  data: DataPoint[];
  width?: number;
  height?: number;
}

export default function RevenueChart({ data, width = 600, height = 300 }: Props) {
  if (!data || data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 40, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.flatMap((d) => [d.revenue, d.expense]));
  const yMax = Math.ceil(maxValue / 200000) * 200000;

  const xStep = chartWidth / (data.length - 1);
  const yScale = (value: number) => chartHeight - (value / yMax) * chartHeight;

  const revenuePoints = data
    .map((d, i) => `${i * xStep},${yScale(d.revenue)}`)
    .join(' ');
  const expensePoints = data
    .map((d, i) => `${i * xStep},${yScale(d.expense)}`)
    .join(' ');

  const revenueAreaPoints = [
    `0,${chartHeight}`,
    ...data.map((d, i) => `${i * xStep},${yScale(d.revenue)}`),
    `${(data.length - 1) * xStep},${chartHeight}`,
  ].join(' ');

  const expenseAreaPoints = [
    `0,${chartHeight}`,
    ...data.map((d, i) => `${i * xStep},${yScale(d.expense)}`),
    `${(data.length - 1) * xStep},${chartHeight}`,
  ].join(' ');

  const yTicks = 5;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ fontFamily: 'inherit' }}
    >
      <defs>
        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <g transform={`translate(${padding.left}, ${padding.top})`}>
        {/* Horizontal grid lines and Y-axis labels */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const value = (yMax / yTicks) * (yTicks - i);
          const y = yScale(value);
          return (
            <g key={i}>
              <line
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray={i === yTicks ? '0' : '4,4'}
              />
              <text
                x={-8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#94a3b8"
              >
                {value >= 100000 ? `₹${(value / 100000).toFixed(1)}L` : `₹${value}`}
              </text>
            </g>
          );
        })}

        {/* Area fills */}
        <polyline
          points={revenueAreaPoints}
          fill="url(#revenueGrad)"
          stroke="none"
        />
        <polyline
          points={expenseAreaPoints}
          fill="url(#expenseGrad)"
          stroke="none"
        />

        {/* Lines */}
        <polyline
          points={revenuePoints}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={expensePoints}
          fill="none"
          stroke="#f43f5e"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points - Revenue */}
        {data.map((d, i) => (
          <circle
            key={`rev-${i}`}
            cx={i * xStep}
            cy={yScale(d.revenue)}
            r="4"
            fill="#6366f1"
            stroke="#fff"
            strokeWidth="2"
          />
        ))}

        {/* Data points - Expense */}
        {data.map((d, i) => (
          <circle
            key={`exp-${i}`}
            cx={i * xStep}
            cy={yScale(d.expense)}
            r="4"
            fill="#f43f5e"
            stroke="#fff"
            strokeWidth="2"
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={`label-${i}`}
            x={i * xStep}
            y={chartHeight + 24}
            textAnchor="middle"
            fontSize="11"
            fill="#64748b"
          >
            {d.month}
          </text>
        ))}

        {/* X-axis line */}
        <line
          x1={0}
          y1={chartHeight}
          x2={chartWidth}
          y2={chartHeight}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      </g>

      {/* Legend */}
      <g transform={`translate(${width - 160}, 8)`}>
        <circle cx="8" cy="8" r="5" fill="#6366f1" />
        <text x="18" y="12" fontSize="11" fill="#64748b">Revenue</text>
        <circle cx="88" cy="8" r="5" fill="#f43f5e" />
        <text x="98" y="12" fontSize="11" fill="#64748b">Expense</text>
      </g>
    </svg>
  );
}
