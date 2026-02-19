"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, ClipboardList, FileCheck2, Ship } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export default function EstatisticasPage() {
  const router = useRouter()
  const { currentUser, entries, vessels } = useApp()

  const canAccess =
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "COMPANY_ADMIN" ||
    currentUser?.role === "NUTRI_ADMIN"

  useEffect(() => {
    if (!currentUser || !canAccess) {
      router.replace("/dashboard")
    }
  }, [canAccess, currentUser, router])

  if (!currentUser || !canAccess) return null

  const entriesScope =
    currentUser.role === "SUPER_ADMIN"
      ? entries
      : entries.filter((entry) => entry.companyId === currentUser.companyId)

  const vesselsScope =
    currentUser.role === "SUPER_ADMIN"
      ? vessels
      : vessels.filter((vessel) => vessel.companyId === currentUser.companyId)

  const totals = useMemo(() => {
    const rowsTotal = entriesScope.reduce((acc, entry) => acc + entry.rows.length, 0)
    const approved = entriesScope.filter((entry) => entry.status === "aprovada" || entry.status === "sincronizada").length

    return {
      forms: entriesScope.length,
      rows: rowsTotal,
      vessels: vesselsScope.length,
      approved,
    }
  }, [entriesScope, vesselsScope.length])

  const statusChartData = useMemo(() => {
    const labels: Record<string, string> = {
      rascunho: "Rascunho",
      em_revisao: "Em revisão",
      revisada: "Revisada",
      aprovada: "Aprovada",
      sincronizada: "Sincronizada",
    }

    const counts = entriesScope.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1
      return acc
    }, {})

    return Object.keys(labels).map((key) => ({
      status: labels[key],
      total: counts[key] || 0,
    }))
  }, [entriesScope])

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Estatísticas</h1>
          <p className="text-sm text-muted-foreground">Resumo operacional dos formulários e registros.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Formulários</p>
            <p className="text-2xl font-bold">{totals.forms}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Registros</p>
            <p className="text-2xl font-bold">{totals.rows}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Embarcações</p>
            <p className="text-2xl font-bold">{totals.vessels}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Aprovados</p>
            <p className="text-2xl font-bold">{totals.approved}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status dos formulários</CardTitle>
          <CardDescription>Quantidade de formulários por etapa do fluxo.</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="status" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.45)" }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "#111827",
                }}
                labelStyle={{ color: "#111827", fontWeight: 600 }}
                itemStyle={{ color: "#111827" }}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><Ship className="h-4 w-4" /> Cobertura</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{totals.vessels > 0 ? "Há embarcações com dados ativos." : "Nenhuma embarcação disponível."}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><ClipboardList className="h-4 w-4" /> Produtividade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Média de {totals.forms > 0 ? (totals.rows / totals.forms).toFixed(1) : "0"} registros por formulário.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><FileCheck2 className="h-4 w-4" /> Qualidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{totals.forms > 0 ? `${Math.round((totals.approved / totals.forms) * 100)}% dos formulários foram aprovados.` : "Sem dados para avaliar."}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
