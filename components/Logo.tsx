import { cn } from "@/lib/cn";

interface Props {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 28 }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="ecoOracleLogo" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#67ffb1" />
            <stop offset="60%" stopColor="#0ed373" />
            <stop offset="100%" stopColor="#0073db" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="14" stroke="url(#ecoOracleLogo)" strokeWidth="1.4" />
        <circle cx="16" cy="16" r="9" stroke="url(#ecoOracleLogo)" strokeWidth="1" opacity="0.7" />
        <path
          d="M16 6c-3.5 4-3.5 7 0 10s3.5 6 0 10"
          stroke="url(#ecoOracleLogo)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="2" fill="#67ffb1" />
      </svg>
      <span className="font-semibold tracking-tight text-white">
        Eco<span className="text-eco-400">Oracle</span>
      </span>
    </span>
  );
}
