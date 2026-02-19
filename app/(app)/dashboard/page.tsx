"use client"

import { useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { VesselSelector } from "@/components/vessel-selector"
import { StatusBadge } from "@/components/status-badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ClipboardList,
  CheckCircle,
  Clock,
  FileText,
  Ship,
} from "lucide-react"
import type { FormEntryStatus } from "@/lib/types"

export default function DashboardPage() {
  const router = useRouter()
  const { currentUser, selectedVessel, templates, entries, companies } = useApp()

  const companyName = currentUser?.companyId
    ? companies.find((c) => c.id === currentUser.companyId)?.name
    : currentUser?.role === "SUPER_ADMIN"
        ? "Admin Global"
        : "Sem empresa"

  // Filter entries for current vessel
  const vesselEntries = selectedVessel
    ? entries.filter((e) => e.vesselId === selectedVessel.id)
    : []

  // Count entries by status
  const statusCounts = vesselEntries.reduce(
    (acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1
      return acc
    },
    {} as Record<FormEntryStatus, number>
  )

  const summaryCards = [
    {
      label: "Rascunhos",
      count: statusCounts.rascunho || 0,
      icon: FileText,
      color: "text-muted-foreground",
    },
    {
      label: "Em Revisao",
      count: statusCounts.em_revisao || 0,
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      label: "Aprovados",
      count: statusCounts.aprovada || 0,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      label: "Total",
      count: vesselEntries.length,
      icon: ClipboardList,
      color: "text-primary",
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-balance">
          Ola, {currentUser?.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {companyName} - Painel de Controle
        </p>
      </div>

      {/* Vessel Selector */}
      <VesselSelector />

      {/* No vessel selected */}
      {!selectedVessel && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Ship className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium">
                Selecione uma embarcacao para comecar
              </p>
              <p className="text-sm text-muted-foreground">
                Escolha a embarcacao acima para visualizar e preencher
                formularios.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      {selectedVessel && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {summaryCards.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.label}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Icon className={`h-5 w-5 shrink-0 ${item.color}`} />
                    <div className="min-w-0">
                      <p className="text-2xl font-bold">{item.count}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Form templates */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Formularios Disponiveis</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((template) => {
                // Find existing entries for this template + vessel
                const templateEntries = vesselEntries.filter(
                  (e) => e.templateId === template.id
                )
                const latestEntry = templateEntries[templateEntries.length - 1]

                return (
                  <Card
                    key={template.id}
                    className="cursor-pointer transition-colors hover:bg-accent/50 active:bg-accent"
                    onClick={() => router.push(`/formularios/${template.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">
                          {template.name}
                        </CardTitle>
                        {latestEntry && (
                          <StatusBadge status={latestEntry.status} />
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {templateEntries.length} registro
                          {templateEntries.length !== 1 ? "s" : ""}
                        </span>
                        <span className="font-medium text-primary">
                          Abrir
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Recent entries */}
          {vesselEntries.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">
                Registros Recentes
              </h2>
              <div className="flex flex-col gap-2">
                {vesselEntries
                  .sort(
                    (a, b) =>
                      new Date(b.updatedAt).getTime() -
                      new Date(a.updatedAt).getTime()
                  )
                  .slice(0, 5)
                  .map((entry) => {
                    const template = templates.find(
                      (t) => t.id === entry.templateId
                    )
                    return (
                      <Card
                        key={entry.id}
                        className="cursor-pointer transition-colors hover:bg-accent/50"
                        onClick={() =>
                          router.push(`/formularios/${entry.templateId}?entry=${entry.id}`)
                        }
                      >
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {template?.shortName || "Formulario"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Periodo: {entry.period} - {entry.rows.length}{" "}
                              registro{entry.rows.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <StatusBadge status={entry.status} />
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
