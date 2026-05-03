import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  trend?: { value: number; positiveIsGood?: boolean };
  className?: string;
}

export function StatTile({ label, value, hint, icon, trend, className }: Props) {
  const positiveIsGood = trend?.positiveIsGood ?? true;
  const trendColor =
    !trend
      ? ""
      : trend.value === 0
        ? "text-white/50"
        : (trend.value > 0) === positiveIsGood
          ? "text-eco-300"
          : "text-danger-400";

  return (
    <div className={cn("stat-tile", className)}>
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {icon && <span className="text-eco-300/70">{icon}</span>}
      </div>
      <div className="stat-value tabular-nums">{value}</div>
      <div className="flex items-center justify-between gap-2 text-xs">
        {hint && <span className="text-white/45">{hint}</span>}
        {trend && (
          <span className={cn("font-medium tabular-nums", trendColor)}>
            {trend.value > 0 ? "+" : ""}
            {trend.value.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
            %
          </span>
        )}
      </div>
    </div>
  );
}
