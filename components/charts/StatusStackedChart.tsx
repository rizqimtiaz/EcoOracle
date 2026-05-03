"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Datum {
  date: string;
  active: number;
  warning: number;
  invalidated: number;
}

export function StatusStackedChart({ data }: { data: Datum[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, left: -12, right: 8, bottom: 0 }}>
          <CartesianGrid stroke="#1b2a36" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            interval={5}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "#0e161e",
              border: "1px solid #1b2a36",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: "rgba(255,255,255,0.7)" }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}
          />
          <Bar dataKey="active" stackId="s" fill="#2ef191" radius={[4, 4, 0, 0]} />
          <Bar dataKey="warning" stackId="s" fill="#ffb454" radius={[0, 0, 0, 0]} />
          <Bar dataKey="invalidated" stackId="s" fill="#ff6c6c" radius={[0, 0, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
