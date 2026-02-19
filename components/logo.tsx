"use client"

import Link from "next/link"
import { useApp } from "@/components/app-provider"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
  href?: string
}

const sizeMap = {
  sm: { logo: "h-8", text: "text-sm" },
  md: { logo: "h-10", text: "text-base" },
  lg: { logo: "h-14", text: "text-lg" },
}

export function Logo({ size = "md", className, href }: LogoProps) {
  const s = sizeMap[size]
  const { currentUser } = useApp()

  const logoImage = currentUser?.avatarUrl || "/sealogapp-logo.svg"

  return (
    <Link
      href={href || "/"}
      className={cn("flex items-center gap-2 select-none", className)}
      aria-label="Ir para a pagina inicial"
    >
      <img src={logoImage} alt="Logo SeaNutri" className={cn("w-auto rounded", s.logo)} />
      <span className={cn("font-semibold tracking-tight text-foreground", s.text)}>SeaLogApp</span>
    </Link>
  )
}
