'use client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  month:   string;
  revenue: number;
  expense: number;
}

interface Props {
  data:    DataPoint[];
  width?:  number;
  height?: number;
}

function formatY(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000)   return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const rev = Number(payload[0]?.value ?? 0);
  const exp = Number(payload[1]?.value ?? 0);
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: '10px', padding: '12px 16px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '13px',
    }}>
      <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>{label}</p>
      {payload.map((item: { name: string; value: number; color: string }) => (
        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, display: 'inline-block' }} />
          <span style={{ color: '#64748b' }}>{item.name}:</span>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatY(item.value)}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '8px', paddingTop: '8px' }}>
        <span style={{ color: '#64748b' }}>Net: </span>
        <span style={{ fontWeight: 700, color: rev >= exp ? '#16a34a' : '#dc2626' }}>
          {formatY(rev - exp)}
        </span>
      </div>
    </div>
  );
};

export default function RevenueChart({ data, height = 300 }: Props) {
  if (!data?.length) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px' }}>
        No chart data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ec4899" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#ec4899" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          tickFormatter={formatY}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={62}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }} iconType="circle" iconSize={8} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#6366f1"
          strokeWidth={2.5}
          fill="url(#revenueGrad)"
          dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="expense"
          name="Expense"
          stroke="#ec4899"
          strokeWidth={2.5}
          fill="url(#expenseGrad)"
          dot={{ fill: '#ec4899', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
