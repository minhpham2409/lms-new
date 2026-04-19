"use client";

export type DashboardStatCardType = "primary" | "success" | "warning" | "info";

interface DashboardStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
  type?: DashboardStatCardType;
}

export function DashboardStatCard({
  icon,
  label,
  value,
  change,
  type = "primary",
}: DashboardStatCardProps) {
  const bgColor = {
    primary: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    success: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
    warning: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
    info: "bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800",
  };

  const iconColor = {
    primary: "text-blue-700 dark:text-blue-300",
    success: "text-green-700 dark:text-green-300",
    warning: "text-amber-700 dark:text-amber-300",
    info: "text-cyan-700 dark:text-cyan-300",
  };

  return (
    <div className={`p-6 rounded-lg border ${bgColor[type]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconColor[type]}`}>
          {icon}
        </div>
        {change && (
          <div className="text-sm font-medium">
            {change.startsWith("+") ? (
              <span className="text-green-700 dark:text-green-300">↑ {change}</span>
            ) : (
              <span className="text-red-700 dark:text-red-300">↓ {change}</span>
            )}
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label}
      </h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
        {value}
      </p>
    </div>
  );
}

interface SimpleChartProps {
  title: string;
  data: { label: string; value: number; color: string }[];
}

export function SimpleBarChart({ title, data }: SimpleChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-50">
        {title}
      </h3>
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-50">
                {item.value}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${item.color}`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PieChartSimpleProps {
  title: string;
  data: { label: string; value: number; color: string }[];
}

export function SimplePieChart({ title, data }: PieChartSimpleProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-50">
        {title}
      </h3>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {item.label}
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-50 ml-auto">
              {((item.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
