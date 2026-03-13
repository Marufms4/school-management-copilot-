'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataItem { name: string; value: number; fill?: string; }

interface Props {
  // Accept either an explicit data array OR numeric props
  data?:    DataItem[];
  paid?:    number;
  partial?: number;
  pending?: number;
  height?:  number;
}

const DEFAULT_COLORS = ['#16a34a', '#d97706', '#dc2626'];
const RADIAN = Math.PI / 180;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function FeeStatusChart({ data, paid = 0, partial = 0, pending = 0, height = 220 }: Props) {
  // Normalise to a single array
  const chartData: DataItem[] = data
    ? data
    : [
        { name: 'Paid',    value: paid,    fill: '#16a34a' },
        { name: 'Partial', value: partial, fill: '#d97706' },
        { name: 'Pending', value: pending, fill: '#dc2626' },
      ];

  const filtered = chartData.filter((d) => d.value > 0);

  if (!filtered.length) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px' }}>
        No fee data
      </div>
    );
  }

  const innerR = height < 160 ? 28 : 40;
  const outerR = height < 160 ? 52 : 80;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={filtered}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={height >= 160 ? renderCustomLabel : undefined}
          outerRadius={outerR}
          innerRadius={innerR}
          dataKey="value"
          strokeWidth={2}
        >
          {filtered.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [`${value} records`, name]}
          contentStyle={{ borderRadius: '8px', fontSize: '13px', border: '1px solid #e2e8f0' }}
        />
        {height >= 160 && (
          <Legend wrapperStyle={{ fontSize: '13px' }} iconType="circle" iconSize={8} />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
