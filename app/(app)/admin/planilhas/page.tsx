"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ClipboardList, Plus, ArrowRight } from "lucide-react"

export default function AdminPlanilhasPage() {
  const router = useRouter()
  const { currentUser, templates, refreshTemplates } = useApp()
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      router.replace("/dashboard")
      return
    }
    refreshTemplates()
  }, [currentUser, router, refreshTemplates])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return templates
    return templates.filter((t) => (t.name + " " + t.shortName + " " + t.type).toLowerCase().includes(q))
  }, [templates, search])

  if (!currentUser || currentUser.role !== "SUPER_ADMIN") return null

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Planilhas (Templates)</h1>
            <p className="text-sm text-muted-foreground">Crie e edite planilhas globais e selecione as empresas habilitadas</p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => router.push("/admin/planilhas/nova")}>
          <Plus className="h-4 w-4" />
          Nova planilha
        </Button>
      </div>

      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar planilha..." />

      <div className="grid gap-3">
        {filtered.map((t) => (
          <Card key={t.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => router.push(`/admin/planilhas/${t.id}`)}>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="truncate">{t.name}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription className="text-xs">
                {t.shortName} • {t.type} • v{t.version} • ID: {t.id}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma planilha encontrada.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
