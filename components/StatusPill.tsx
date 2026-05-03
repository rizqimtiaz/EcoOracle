import { classFor } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Props {
  status: string;
  className?: string;
}

export function StatusPill({ status, className }: Props) {
  const c = classFor(status);
  return (
    <span className={cn("badge", c.bg, c.text, c.ring, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
