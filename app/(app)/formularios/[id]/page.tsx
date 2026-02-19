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
import { Plus, Save, Send, Ship } from "lucide-react"
import { generateId } from "@/lib/store"
import type { FormEntry, FormRowData } from "@/lib/types"
import { validateFieldValue } from "@/lib/form-validation"
import { toast } from "@/hooks/use-toast"

// Generate month options
function getMonthOptions() {
  const options: { label: string; value: string }[] = []
  const now = new Date()
  for (let i = -24; i <= 3; i++) {
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

function formatDateBr(value: string) {
  if (!value) return "-"
  const [year, month, day] = value.split("-")
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
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
  const [currentYear, currentMonthNumber] = (existingEntry?.period || currentMonth).split("-")

  const [period, setPeriod] = useState(existingEntry?.period || currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthNumber)
  const [rows, setRows] = useState<FormRowData[]>(existingEntry?.rows || [])
  const [currentRow, setCurrentRow] = useState<FormRowData>(existingEntry?.rows[0] || createEmptyRow())
  const [selectedRowId, setSelectedRowId] = useState(existingEntry?.rows[0]?.id || "")
  const [status, setStatus] = useState(existingEntry?.status || "rascunho" as const)
  const [saved, setSaved] = useState(false)
  const [entryRef, setEntryRef] = useState(existingEntry?.id || "")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [filterTerm, setFilterTerm] = useState("")
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "shift-asc" | "shift-desc">("date-desc")

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
        setCurrentRow(found.rows[0] || createEmptyRow())
        setSelectedRowId(found.rows[0]?.id || "")
        setStatus(found.status)
        setEntryRef(found.id)
      } else {
        setRows([])
        setCurrentRow(createEmptyRow())
        setSelectedRowId("")
        setStatus("rascunho")
        setEntryRef("")
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
    (fieldId: string, value: string | number | boolean) => {
      setCurrentRow((prev) => ({
        ...prev,
        values: { ...prev.values, [fieldId]: value },
      }))
      setSaved(false)
    },
    []
  )

  function upsertCurrentRow() {
    setRows((prev) => {
      const exists = prev.some((row) => row.id === currentRow.id)
      if (exists) {
        return prev.map((row) => (row.id === currentRow.id ? currentRow : row))
      }
      return [...prev, currentRow]
    })
    setCurrentRow(createEmptyRow())
    setSelectedRowId("")
    setSaved(false)
  }

  function currentRowHasTypedData() {
    return Object.values(currentRow.values).some((value) => value !== "" && value !== null && value !== undefined)
  }

  function startNewRow() {
    const rowNotInTable = !rows.some((row) => row.id === currentRow.id)
    if (rowNotInTable && currentRowHasTypedData()) {
      const confirmed = window.confirm("Tem certeza? Essa acao ira apagar todos os dados inseridos no registro atual.")
      if (!confirmed) return
    }

    const next = createEmptyRow()
    setCurrentRow(next)
    setSelectedRowId("")
    setSaved(false)
  }

  function selectRow(rowId: string) {
    const row = rows.find((item) => item.id === rowId)
    if (!row) return
    setCurrentRow(row)
    setSelectedRowId(row.id)
  }

  const filteredRows = useMemo(() => {
    const term = filterTerm.trim().toLowerCase()
    const prepared = rows.filter((row, index) => {
      if (!term) return true
      const valuesText = Object.values(row.values).join(" ").toLowerCase()
      const baseText = `${index + 1} ${row.date} ${row.time} ${row.shift}`.toLowerCase()
      return baseText.includes(term) || valuesText.includes(term)
    })

    return [...prepared].sort((a, b) => {
      if (sortBy === "date-asc") {
        return `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
      }
      if (sortBy === "date-desc") {
        return `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)
      }
      if (sortBy === "shift-asc") {
        return a.shift.localeCompare(b.shift)
      }
      return b.shift.localeCompare(a.shift)
    })
  }, [rows, filterTerm, sortBy])

  const periodYears = useMemo(
    () => Array.from(new Set(monthOptions.map((opt) => opt.value.split("-")[0]))).sort((a, b) => Number(b) - Number(a)),
    [monthOptions]
  )
  const periodMonths = useMemo(
    () => monthOptions.filter((opt) => opt.value.startsWith(`${selectedYear}-`)),
    [monthOptions, selectedYear]
  )

  useEffect(() => {
    const next = `${selectedYear}-${selectedMonth}`
    if (period !== next) {
      setPeriod(next)
      setSaved(false)
    }
  }, [selectedYear, selectedMonth, period])

  useEffect(() => {
    const [year, month] = period.split("-")
    if (year && year !== selectedYear) setSelectedYear(year)
    if (month && month !== selectedMonth) setSelectedMonth(month)
  }, [period, selectedYear, selectedMonth])

  function saveEntry(newStatus: "rascunho" | "em_revisao" = "rascunho") {
    if (!currentUser || !selectedVessel || !template) return
    if (rows.length === 0) {
      setValidationError("Adicione ao menos um registro na tabela antes de salvar.")
      return
    }

    for (const row of rows) {
      for (const field of allFields) {
        const error = validateFieldValue(field, row.values)
        if (error) {
          setValidationError(`Registro ${rows.indexOf(row) + 1}: ${error}`)
          return
        }
      }
    }

    setValidationError(null)

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

    if (newStatus !== "rascunho") {
      toast({ title: "Formulario salvo", description: "Registro enviado e salvo com sucesso." })
      router.back()
    }
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Ano</label>
          <Select value={selectedYear} onValueChange={setSelectedYear} disabled={isReadOnly}>
            <SelectTrigger className="select-none">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {periodYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Mes</label>
          <Select
            value={`${selectedYear}-${selectedMonth}`}
            onValueChange={(value) => setSelectedMonth(value.split("-")[1])}
            disabled={isReadOnly}
          >
            <SelectTrigger className="select-none">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {periodMonths.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
      {validationError && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive-foreground">{validationError}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registro atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {template.sections.map((section) => (
            <div key={section.id} className="flex flex-col gap-3">
              {section.title && template.sections.length > 1 && (
                <p className="text-sm font-medium text-muted-foreground">
                  {section.title}
                </p>
              )}
              <FormRowRenderer
                fields={section.fields}
                row={currentRow}
                onChange={handleFieldChange}
                disabled={isReadOnly}
              />
            </div>
          ))}
          {!isReadOnly && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="select-none gap-2" onClick={upsertCurrentRow}>
                <Plus className="h-4 w-4" />
                Adicionar Registro
              </Button>
              <Button variant="outline" className="select-none" onClick={startNewRow}>
                Novo Registro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-base">Tabela de registros</CardTitle>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              placeholder="Filtrar por data, turno ou valor"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
            />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="select-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Mais recente primeiro</SelectItem>
                <SelectItem value="date-asc">Mais antigo primeiro</SelectItem>
                <SelectItem value="shift-asc">Turno (A-Z)</SelectItem>
                <SelectItem value="shift-desc">Turno (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium">Hora</th>
                  <th className="px-3 py-2 font-medium">Turno</th>
                  <th className="px-3 py-2 font-medium">Campos preenchidos</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`cursor-pointer border-t hover:bg-muted/40 ${selectedRowId === row.id ? "bg-muted" : ""}`}
                    onClick={() => !isReadOnly && selectRow(row.id)}
                  >
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">{formatDateBr(row.date)}</td>
                    <td className="px-3 py-2">{row.time || "-"}</td>
                    <td className="px-3 py-2">{row.shift || "-"}</td>
                    <td className="px-3 py-2">{Object.values(row.values).filter((value) => value !== "" && value !== null && value !== undefined).length}</td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-5 text-center text-muted-foreground">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 text-sm text-amber-900">
            Adicione ao menos um registro na tabela para salvar como rascunho ou enviar para revisao.
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      {!isReadOnly && (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="select-none gap-2"
            onClick={() => saveEntry("rascunho")}
            disabled={rows.length === 0}
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
                  disabled={rows.length === 0}
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
