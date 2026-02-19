import { Anchor } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = {
  sm: { icon: 20, text: "text-lg", gap: "gap-2" },
  md: { icon: 28, text: "text-2xl", gap: "gap-2.5" },
  lg: { icon: 40, text: "text-4xl", gap: "gap-3" },
}

export function Logo({ size = "md", className }: LogoProps) {
  const s = sizeMap[size]

  return (
    <div className={cn("flex items-center select-none", s.gap, className)}>
      <div className="relative">
        <Anchor className="text-primary" size={s.icon} strokeWidth={2.5} />
      </div>
      <span className={cn("font-bold tracking-tight text-foreground", s.text)}>
        Sea
        <span className="text-primary">Log</span>
      </span>
    </div>
  )
}
