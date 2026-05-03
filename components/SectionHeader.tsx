import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-bg-line/60 pb-5 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div>
        {eyebrow && (
          <div className="mb-1 text-xs font-medium uppercase tracking-wider-2 text-eco-400/80">
            {eyebrow}
          </div>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-3xl text-white/55">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
