'use client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface PayrollDataPoint {
  name:        string;
  basicSalary: number;
  netSalary:   number;
  grossSalary: number;
}

interface Props {
  data:    PayrollDataPoint[];
  height?: number;
}

function formatY(value: number): string {
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
}

export default function PayrollBarChart({ data, height = 280 }: Props) {
  if (!data?.length) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px' }}>
        No payroll data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={18} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          interval={0}
        />
        <YAxis
          tickFormatter={formatY}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [formatY(Number(value)), name]}
          contentStyle={{ borderRadius: '8px', fontSize: '13px', border: '1px solid #e2e8f0' }}
        />
        <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
        <Bar dataKey="grossSalary" name="Gross" fill="#6366f1" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill="#6366f1" fillOpacity={0.85} />)}
        </Bar>
        <Bar dataKey="netSalary"   name="Net"   fill="#16a34a" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill="#16a34a" fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
