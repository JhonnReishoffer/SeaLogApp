import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = {
  sm: { logo: "h-8", text: "text-sm" },
  md: { logo: "h-10", text: "text-base" },
  lg: { logo: "h-14", text: "text-lg" },
}

export function Logo({ size = "md", className }: LogoProps) {
  const s = sizeMap[size]

  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <img src="/sealogapp-logo.svg" alt="Logo SeaNutri" className={cn("w-auto", s.logo)} />
      <span className={cn("font-semibold tracking-tight text-foreground", s.text)}>SeaLogApp</span>
    </div>
  )
}
