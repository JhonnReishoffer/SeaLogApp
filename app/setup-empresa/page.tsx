"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Building2 } from "lucide-react"

export default function SetupEmpresaPage() {
  const router = useRouter()
  const { currentUser, updateCurrentUser } = useApp()
  const [company, setCompany] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!currentUser) {
      router.replace("/login")
      return
    }
    if (currentUser.company) {
      router.replace("/dashboard")
    }
  }, [currentUser, router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const trimmed = company.trim().toUpperCase()
    if (!trimmed) {
      setError("Informe o nome da empresa")
      return
    }
    if (trimmed.length < 2) {
      setError("Nome da empresa deve ter pelo menos 2 caracteres")
      return
    }

    if (!currentUser) return

    const role = trimmed === "SEANUTRI" ? "admin" : currentUser.role
    updateCurrentUser({
      ...currentUser,
      company: trimmed,
      role,
    })

    router.replace("/dashboard")
  }

  if (!currentUser) return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        <Logo size="lg" />

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Configurar Empresa</CardTitle>
            <CardDescription>
              Informe o nome da sua empresa para continuar. Este campo nao
              podera ser alterado depois.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="company">Nome da Empresa</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="company"
                    type="text"
                    placeholder="NOME DA EMPRESA"
                    value={company}
                    onChange={(e) => setCompany(e.target.value.toUpperCase())}
                    className="pl-10 uppercase"
                    autoComplete="organization"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  O nome sera convertido para maiusculas automaticamente.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive-foreground">{error}</p>
              )}

              <Button type="submit" className="w-full select-none">
                Confirmar Empresa
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
