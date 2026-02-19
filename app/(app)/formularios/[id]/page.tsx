"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { FormRowRenderer } from "@/components/form-renderer"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Trash2, Save, Send, Ship } from "lucide-react"
import { generateId } from "@/lib/store"
import type { FormEntry, FormRowData } from "@/lib/types"

// Generate month options
function getMonthOptions() {
  const options: { label: string; value: string }[] = []
  const now = new Date()
  for (let i = -3; i <= 3; i++) {
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

function guessShiftFromHour(h: number): "Manha" | "Tarde" | "Noite" {
  if (h >= 6 && h < 12) return "Manha"
  if (h >= 12 && h < 18) return "Tarde"
  return "Noite"
}

function createEmptyRow(): FormRowData {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  const hh = String(now.getHours()).padStart(2, "0")
  const mi = String(now.getMinutes()).padStart(2, "0")
  return {
    id: generateId(),
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${mi}`,
    shift: guessShiftFromHour(now.getHours()),
    values: {},
  }
}

export default function FormFillingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const {
    currentUser,
    selectedVessel,
    templates,
    entries,
    createEntry,
    updateEntry,
  } = useApp()

  const templateId = params.id as string
  const entryId = searchParams.get("entry")

  const template = templates.find((t) => t.id === templateId)
  const existingEntry = entryId
    ? entries.find((e) => e.id === entryId)
    : null

  const monthOptions = useMemo(() => getMonthOptions(), [])
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`

  const [period, setPeriod] = useState(
    existingEntry?.period || currentMonth
  )
  const [rows, setRows] = useState<FormRowData[]>(existingEntry?.rows || [createEmptyRow()])
  const [status, setStatus] = useState(existingEntry?.status || "rascunho" as const)
  const [saved, setSaved] = useState(false)
  const [entryRef, setEntryRef] = useState(existingEntry?.id || "")

  // Check if we should load existing entry for this period
  useEffect(() => {
    if (!entryId && selectedVessel && template) {
      const found = entries.find(
        (e) =>
          e.templateId === template.id &&
          e.vesselId === selectedVessel.id &&
          e.period === period
      )
      if (found) {
        setRows(found.rows)
        setStatus(found.status)
        setEntryRef(found.id)
      }
    }
  }, [period, selectedVessel, template, entries, entryId])

  const allFields = useMemo(
    () => template?.sections.flatMap((s) => s.fields) || [],
    [template]
  )

  const isReadOnly =
    status === "aprovada" || status === "sincronizada" || status === "em_revisao"

  const handleFieldChange = useCallback(
    (rowId: string, fieldId: string, value: string | number | boolean) => {
      setRows((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? { ...row, values: { ...row.values, [fieldId]: value } }
            : row
        )
      )
      setSaved(false)
    },
    []
  )

  function addRow() {
    setRows((prev) => [...prev, createEmptyRow()])
    setSaved(false)
  }

  function removeRow(rowId: string) {
    setRows((prev) => prev.filter((r) => r.id !== rowId))
    setSaved(false)
  }

  function saveEntry(newStatus: "rascunho" | "em_revisao" = "rascunho") {
    if (!currentUser || !selectedVessel || !template) return

    const now = new Date().toISOString()
    const entry: FormEntry = {
      id: entryRef || generateId(),
      templateId: template.id,
      vesselId: selectedVessel.id,
      vesselName: selectedVessel.name,
      userId: currentUser.id,
      userName: currentUser.name,
      companyId: currentUser.companyId || "",
      period,
      rows,
      status: newStatus,
      reviewHistory:
        existingEntry?.reviewHistory ||
        (newStatus === "em_revisao"
          ? [
              {
                action: "enviado",
                by: currentUser.id,
                byName: currentUser.name,
                date: now,
              },
            ]
          : []),
      createdAt: existingEntry?.createdAt || now,
      updatedAt: now,
    }

    if (newStatus === "em_revisao" && existingEntry) {
      entry.reviewHistory = [
        ...entry.reviewHistory,
        {
          action: "enviado",
          by: currentUser.id,
          byName: currentUser.name,
          date: now,
        },
      ]
    }

    if (entryRef) {
      updateEntry(entry)
    } else {
      createEntry(entry)
      setEntryRef(entry.id)
    }

    setStatus(newStatus)
    setSaved(true)
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-muted-foreground">Formulario nao encontrado</p>
        <Button onClick={() => router.back()} className="select-none">
          Voltar
        </Button>
      </div>
    )
  }

  if (!selectedVessel) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <Ship className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Selecione uma embarcacao primeiro
        </p>
        <Button onClick={() => router.push("/dashboard")} className="select-none">
          Ir para Inicio
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-balance">{template.name}</h1>
            <p className="text-sm text-muted-foreground">
              {selectedVessel.name}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Period selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Periodo</label>
        <Select
          value={period}
          onValueChange={(v) => {
            setPeriod(v)
            setSaved(false)
          }}
          disabled={isReadOnly}
        >
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

      {/* Revisada notice */}
      {status === "revisada" && existingEntry?.reviewHistory && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
            <p className="text-sm">
              {(() => {
                const revisadaEntry = [...existingEntry.reviewHistory]
                  .reverse()
                  .find((h) => h.action === "revisada")
                return revisadaEntry?.note || "Revisada pelo supervisor"
              })()}
              {" - Voce pode editar e reenviar."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Correction notice */}
      {status === "rascunho" && existingEntry?.reviewHistory && (() => {
        const lastAction = [...existingEntry.reviewHistory].reverse().find((h) => h.action === "correcao")
        if (!lastAction) return null
        return (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive-foreground">Correcao solicitada</p>
                <p className="text-sm text-muted-foreground">{lastAction.note}</p>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Rows */}
      <div className="flex flex-col gap-4">
        {rows.map((row, index) => (
          <Card key={row.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Registro {index + 1}
                </CardTitle>
                {!isReadOnly && rows.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive-foreground select-none"
                    onClick={() => removeRow(row.id)}
                    aria-label="Remover registro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {template.sections.map((section) => (
                <div key={section.id} className="flex flex-col gap-3">
                  {section.title && template.sections.length > 1 && (
                    <p className="text-sm font-medium text-muted-foreground">
                      {section.title}
                    </p>
                  )}
                  <FormRowRenderer
                    fields={section.fields}
                    row={row}
                    onChange={(fieldId, value) =>
                      handleFieldChange(row.id, fieldId, value)
                    }
                    disabled={isReadOnly}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add row button */}
      {!isReadOnly && (
        <Button
          variant="outline"
          className="w-full select-none gap-2 border-dashed"
          onClick={addRow}
        >
          <Plus className="h-4 w-4" />
          Adicionar Registro
        </Button>
      )}

      {/* Action buttons */}
      {!isReadOnly && (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="select-none gap-2"
            onClick={() => saveEntry("rascunho")}
          >
            <Save className="h-4 w-4" />
            {saved ? "Salvo" : "Salvar Rascunho"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="select-none gap-2">
                <Send className="h-4 w-4" />
                Enviar para Revisao
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Enviar para revisao?</AlertDialogTitle>
                <AlertDialogDescription>
                  Apos enviar, o formulario ficara em modo somente leitura ate
                  que o supervisor revise. Deseja continuar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="select-none">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  className="select-none"
                  onClick={() => saveEntry("em_revisao")}
                >
                  Confirmar Envio
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Read-only notice */}
      {isReadOnly && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 text-center text-sm">
            {status === "em_revisao" && (
              <p>
                Este formulario esta aguardando revisao e nao pode ser editado.
              </p>
            )}
            {status === "aprovada" && (
              <p>Este formulario foi aprovado e nao pode mais ser editado.</p>
            )}
            {status === "sincronizada" && (
              <p>Este formulario ja foi sincronizado.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
