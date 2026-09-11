// components/admin/StatsChart.tsx
"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  blue: "#3b82f6",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  cyan: "#06b6d4",
  orange: "#f97316",
};

const CHART_COLORS = [
  COLORS.blue,
  COLORS.green,
  COLORS.amber,
  COLORS.purple,
  COLORS.pink,
  COLORS.cyan,
  COLORS.orange,
  COLORS.red,
];

interface StatsChartProps {
  data: any[];
  type: "bar" | "line" | "pie";
  title: string;
  dataKey: string;
  secondaryDataKey?: string;
  nameKey: string;
  height?: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-3 text-xs min-w-[140px]">
        <p className="font-semibold text-gray-800 mb-1.5 border-b border-gray-100 pb-1.5">{label}</p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
              <span className="text-gray-600">{item.name}</span>
            </span>
            <span className="font-semibold text-gray-800">{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Legend
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function StatsChart({ 
  data, 
  type, 
  title, 
  dataKey, 
  secondaryDataKey, 
  nameKey,
  height = 300
}: StatsChartProps) {
  // Pie chart dengan label custom
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#374151" 
        textAnchor="middle" 
        dominantBaseline="central"
        className="text-[9px] font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-300">
        <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
          {title}
        </h3>
        <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm font-medium">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>Belum ada data</p>
          </div>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart 
              data={data} 
              margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
              barGap={8}
            >
              <CartesianGrid 
                strokeDasharray="4 4" 
                stroke="#f1f5f9" 
                vertical={false}
              />
              <XAxis 
                dataKey={nameKey} 
                tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Legend content={<CustomLegend />} />
              <Bar 
                dataKey={dataKey} 
                name="Buku Digital" 
                fill={COLORS.blue} 
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
              {secondaryDataKey && (
                <Bar 
                  dataKey={secondaryDataKey} 
                  name="Peminjaman Fisik" 
                  fill={COLORS.amber} 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case "line":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart 
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="4 4" 
                stroke="#f1f5f9" 
                vertical={false}
              />
              <XAxis 
                dataKey={nameKey} 
                tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                name="Views" 
                stroke={COLORS.blue} 
                strokeWidth={3}
                dot={{ r: 5, fill: COLORS.blue, stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                innerRadius={60}
                paddingAngle={2}
                dataKey={dataKey}
                nameKey={nameKey}
                animationDuration={1500}
                animationEasing="ease-in-out"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                content={<CustomLegend />}
                verticalAlign="bottom"
                align="center"
              />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-300">
      <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
        <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></span>
        {title}
      </h3>
      {renderChart()}
    </div>
  );
}