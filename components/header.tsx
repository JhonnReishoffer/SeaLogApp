"use client"

import { useRouter, usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useApp } from "@/components/app-provider"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sun, Moon, LogOut, User, Settings, Shield, Building2, Users } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { currentUser, logout, companies, setDemoRole, setDemoCompany } = useApp()

  const companyName =
    currentUser?.companyId ? companies.find((c) => c.id === currentUser.companyId)?.name : null

  const isHome = pathname === "/dashboard"

  function handleBack() {
    if (isHome) return
    router.back()
  }

  function handleLogout() {
    logout()
    router.replace("/login")
  }

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between border-b bg-card px-4 py-3"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
    >
      <div className="flex items-center gap-3">
        {!isHome ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="select-none shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : null}
        <Logo size="sm" />
      </div>

      <div className="flex items-center gap-1">
        {/* Company badge */}
        {companyName && (
          <span className="mr-2 hidden text-xs font-medium text-muted-foreground sm:inline-block">
            {companyName}
          </span>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="select-none"
          aria-label="Alternar tema"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="select-none"
              aria-label="Menu do usuario"
            >
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.email}
              </p>
            </div>
            <DropdownMenuSeparator />

            {/* MVP demo: switch role */}
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium text-muted-foreground">Modo demonstracao</p>
              <p className="text-[11px] text-muted-foreground">Trocar perfil (MVP)</p>
            </div>
            <DropdownMenuItem onClick={() => setDemoRole("USER")}>
              <Users className="mr-2 h-4 w-4" />
              Ver como Usuario
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDemoRole("COMPANY_ADMIN")}>
              <Building2 className="mr-2 h-4 w-4" />
              Ver como Admin da Empresa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDemoRole("NUTRI_ADMIN")}>
              <Shield className="mr-2 h-4 w-4" />
              Ver como Nutri Admin
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDemoRole("SUPER_ADMIN")}>
              <Shield className="mr-2 h-4 w-4" />
              Ver como Admin Global
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium text-muted-foreground">Trocar empresa</p>
            </div>
            {companies.map((company) => (
              <DropdownMenuItem key={company.id} onClick={() => setDemoCompany(company.id)}>
                <Building2 className="mr-2 h-4 w-4" />
                {company.name}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/perfil")}>
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/configuracoes")}>
              <Settings className="mr-2 h-4 w-4" />
              Configuracoes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
