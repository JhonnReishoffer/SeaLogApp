"use client"

import { usePathname, useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { cn } from "@/lib/utils"
import { Home, ClipboardList, CheckCircle, Download } from "lucide-react"

const NAV_ITEMS = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: Home,
    matchPaths: ["/dashboard"],
  },
  {
    label: "Formularios",
    href: "/formularios",
    icon: ClipboardList,
    matchPaths: ["/formularios"],
  },
  {
    label: "Revisao",
    href: "/revisao",
    icon: CheckCircle,
    matchPaths: ["/revisao"],
  },
  {
    label: "Exportar",
    href: "/exportar",
    icon: Download,
    matchPaths: ["/exportar"],
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser } = useApp()

  const isAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "COMPANY_ADMIN"

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.href === "/revisao") return isAdmin
    return true
  })

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around py-1">
        {visibleItems.map((item) => {
          const isActive = item.matchPaths.some((p) => pathname.startsWith(p))
          const Icon = item.icon

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors select-none",
                "min-w-[64px] active:bg-accent",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
