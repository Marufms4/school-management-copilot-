'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  paid:    number;
  partial: number;
  pending: number;
}

const COLORS = ['#16a34a', '#d97706', '#dc2626'];
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

export default function FeeStatusChart({ paid, partial, pending }: Props) {
  const data = [
    { name: 'Paid',    value: paid    },
    { name: 'Partial', value: partial },
    { name: 'Pending', value: pending },
  ].filter(d => d.value > 0);

  if (!data.length) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px' }}>
        No fee data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={80}
          innerRadius={40}
          dataKey="value"
          strokeWidth={2}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [`${value} records`, name]}
          contentStyle={{ borderRadius: '8px', fontSize: '13px', border: '1px solid #e2e8f0' }}
        />
        <Legend wrapperStyle={{ fontSize: '13px' }} iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}
