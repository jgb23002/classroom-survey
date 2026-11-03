import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { QuestionResult } from '../types/results';
import { formatResultPercentage } from '../utilities/results';

export function ResultsChart({ question }: { question: QuestionResult }) {
  const data = question.choices.map((choice) => ({
    name: choice.text.length > 18 ? `${choice.text.slice(0, 17)}…` : choice.text,
    percentage: choice.percentage,
    label: `${choice.count} · ${formatResultPercentage(choice.percentage)}`,
  }));
  const height = Math.max(180, data.length * 58);

  return (
    <div
      role="img"
      aria-label={`Bar chart for ${question.text}. Exact counts and percentages are listed below.`}
      className="mt-6 w-full"
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 92, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#dde3dd" />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={112}
            tick={{ fill: '#202d2a', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [formatResultPercentage(Number(value)), 'Selected']}
            cursor={{ fill: '#edf4ef' }}
          />
          <Bar dataKey="percentage" fill="#357359" radius={[0, 6, 6, 0]} minPointSize={2}>
            <LabelList dataKey="label" position="right" fill="#202d2a" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
