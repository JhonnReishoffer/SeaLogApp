import { cn } from "@/lib/utils"
import { STATUS_CONFIG, type FormEntryStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: FormEntryStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium select-none",
        config.bgClass,
        config.textClass,
        className
      )}
    >
      {config.label}
    </span>
  )
}
