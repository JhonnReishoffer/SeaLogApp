"use client"

import { useState, useMemo } from "react"
import { useApp } from "@/components/app-provider"
import { VesselSelector } from "@/components/vessel-selector"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Ship, Download, FileSpreadsheet } from "lucide-react"
import { exportToXlsx } from "@/lib/export-xlsx"

function getMonthOptions() {
  const options: { label: string; value: string }[] = []
  const now = new Date()
  for (let i = -6; i <= 1; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const label = d.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    })
    options.push({ label, value: `${year}-${month}` })
  }
  return options
}

export default function ExportarPage() {
  const { selectedVessel, entries, templates } = useApp()
  const monthOptions = useMemo(() => getMonthOptions(), [])
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`

  const [period, setPeriod] = useState(currentMonth)
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [exporting, setExporting] = useState(false)

  const vesselEntries = selectedVessel
    ? entries.filter(
        (e) => e.vesselId === selectedVessel.id && e.period === period
      )
    : []

  const filteredEntries =
    selectedTemplates.length > 0
      ? vesselEntries.filter((e) => selectedTemplates.includes(e.templateId))
      : vesselEntries

  function toggleTemplate(templateId: string) {
    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((t) => t !== templateId)
        : [...prev, templateId]
    )
  }

  async function handleExport() {
    if (!selectedVessel || filteredEntries.length === 0) return
    setExporting(true)
    try {
      await exportToXlsx(
        filteredEntries,
        templates,
        selectedVessel.name,
        period
      )
    } catch (err) {
      console.error("Export error:", err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-xl font-bold">Exportar</h1>
        <p className="text-sm text-muted-foreground">
          Exporte formularios em formato XLSX
        </p>
      </div>

      <VesselSelector />

      {!selectedVessel ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Ship className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Selecione uma embarcacao para exportar
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Period filter */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">Periodo</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="select-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Tipos de Formulario
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {templates.map((template) => {
                const count = vesselEntries.filter(
                  (e) => e.templateId === template.id
                ).length
                return (
                  <label
                    key={template.id}
                    className="flex items-center gap-3 select-none"
                  >
                    <Checkbox
                      checked={selectedTemplates.includes(template.id)}
                      onCheckedChange={() => toggleTemplate(template.id)}
                    />
                    <span className="flex-1 text-sm">{template.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {count} registro{count !== 1 ? "s" : ""}
                    </span>
                  </label>
                )
              })}
              {selectedTemplates.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start select-none text-xs"
                  onClick={() => setSelectedTemplates([])}
                >
                  Limpar filtro
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Resumo da Exportacao
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEntries.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhum registro encontrado para os filtros selecionados
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredEntries.map((entry) => {
                    const template = templates.find(
                      (t) => t.id === entry.templateId
                    )
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {template?.shortName || "Formulario"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.rows.length} registro
                            {entry.rows.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <StatusBadge status={entry.status} />
                      </div>
                    )
                  })}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Total: {filteredEntries.length} formulario
                    {filteredEntries.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export button */}
          <Button
            className="w-full select-none gap-2"
            size="lg"
            disabled={filteredEntries.length === 0 || exporting}
            onClick={handleExport}
          >
            <FileSpreadsheet className="h-5 w-5" />
            {exporting ? "Exportando..." : "Exportar XLSX"}
          </Button>
        </>
      )}
    </div>
  )
}
