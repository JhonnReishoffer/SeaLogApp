"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
// Building icon removed (Select handles UI)

export default function SetupEmpresaPage() {
  const router = useRouter()
  const { currentUser, updateCurrentUser, companies } = useApp()
  const [companyId, setCompanyId] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!currentUser) {
      router.replace("/login")
      return
    }
    if (currentUser.role === "SUPER_ADMIN" || currentUser.companyId) {
      router.replace("/dashboard")
    }
  }, [currentUser, router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!companyId) {
      setError("Selecione a empresa")
      return
    }

    if (!currentUser) return

    updateCurrentUser({
      ...currentUser,
      companyId,
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
                <Label>Empresa</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger className="select-none">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Se sua empresa nao aparecer, peça ao Admin Global para cadastrar.
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
