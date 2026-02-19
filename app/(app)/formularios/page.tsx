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
import { Button } from "@/components/ui/button"
import { Ship, Plus } from "lucide-react"

export default function FormulariosPage() {
  const router = useRouter()
  const { selectedVessel, templates, entries } = useApp()

  const vesselEntries = selectedVessel
    ? entries.filter((e) => e.vesselId === selectedVessel.id)
    : []

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-xl font-bold">Formularios</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie e preencha formularios de controle
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
      ) : (
        <div className="flex flex-col gap-4">
          {/* Template cards with their entries */}
          {templates.map((template) => {
            const templateEntries = vesselEntries.filter(
              (e) => e.templateId === template.id
            )

            return (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0 select-none gap-1"
                      onClick={() =>
                        router.push(`/formularios/${template.id}`)
                      }
                    >
                      <Plus className="h-4 w-4" />
                      Novo
                    </Button>
                  </div>
                </CardHeader>
                {templateEntries.length > 0 && (
                  <CardContent className="flex flex-col gap-2 pt-0">
                    {templateEntries
                      .sort(
                        (a, b) =>
                          new Date(b.updatedAt).getTime() -
                          new Date(a.updatedAt).getTime()
                      )
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="flex cursor-pointer items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 transition-colors hover:bg-secondary"
                          onClick={() =>
                            router.push(
                              `/formularios/${template.id}?entry=${entry.id}`
                            )
                          }
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              Periodo: {entry.period}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.rows.length} registro
                              {entry.rows.length !== 1 ? "s" : ""} -{" "}
                              {new Date(entry.updatedAt).toLocaleDateString(
                                "pt-BR"
                              )}
                            </p>
                          </div>
                          <StatusBadge status={entry.status} />
                        </div>
                      ))}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
