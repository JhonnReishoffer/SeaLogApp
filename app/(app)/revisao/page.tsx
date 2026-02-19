"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { VesselSelector } from "@/components/vessel-selector"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Ship, ClipboardCheck } from "lucide-react"

export default function RevisaoPage() {
  const router = useRouter()
  const { currentUser, selectedVessel, entries, templates } = useApp()

  const isAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "COMPANY_ADMIN"

  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.replace("/dashboard")
    }
  }, [currentUser, isAdmin, router])

  if (!isAdmin) {
    return null
  }

  // Show entries that are in review or recently reviewed for this vessel
  const reviewEntries = selectedVessel
    ? entries
        .filter(
          (e) =>
            e.vesselId === selectedVessel.id &&
            (e.status === "em_revisao" ||
              e.status === "revisada" ||
              e.status === "aprovada")
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
    : []

  const pendingCount = reviewEntries.filter(
    (e) => e.status === "em_revisao"
  ).length

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-xl font-bold">Revisao</h1>
        <p className="text-sm text-muted-foreground">
          Revise e aprove formularios enviados
        </p>
      </div>

      <VesselSelector />

      {!selectedVessel ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Ship className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Selecione uma embarcacao para ver os formularios
            </p>
          </CardContent>
        </Card>
      ) : reviewEntries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Nenhum formulario para revisao
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {pendingCount > 0 && (
            <p className="text-sm font-medium text-yellow-500">
              {pendingCount} formulario{pendingCount !== 1 ? "s" : ""}{" "}
              aguardando revisao
            </p>
          )}

          {reviewEntries.map((entry) => {
            const template = templates.find((t) => t.id === entry.templateId)
            return (
              <Card
                key={entry.id}
                className="cursor-pointer transition-colors hover:bg-accent/50 active:bg-accent"
                onClick={() => router.push(`/revisao/${entry.id}`)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {template?.name || "Formulario"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Periodo: {entry.period} - Por: {entry.userName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.rows.length} registro
                      {entry.rows.length !== 1 ? "s" : ""} -{" "}
                      {new Date(entry.updatedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <StatusBadge status={entry.status} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
