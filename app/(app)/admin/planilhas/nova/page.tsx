"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, GripVertical, Plus, Save, Trash2 } from "lucide-react"
import type { FormField, FormSection, FormTemplate } from "@/lib/types"
import { createGlobalTemplate, generateId } from "@/lib/store"
import { MultiSelect } from "@/components/multi-select"
import { toast } from "@/hooks/use-toast"

const FIELD_TYPES = [
  { value: "text", label: "Texto" },
  { value: "textarea", label: "Texto longo" },
  { value: "number", label: "Numero" },
  { value: "temperature", label: "Temperatura (°C)" },
  { value: "time", label: "Hora" },
  { value: "date", label: "Data" },
  { value: "select", label: "Selecao" },
  { value: "checkbox", label: "Checkbox" },
] as const

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export default function NovaPlanilhaPage() {
  const router = useRouter()
  const { currentUser, companies, refreshTemplates } = useApp()

  const [name, setName] = useState("")
  const [shortName, setShortName] = useState("")
  const [type, setType] = useState("custom")
  const [version, setVersion] = useState("1.0")
  const [description, setDescription] = useState("")
  const [companyIds, setCompanyIds] = useState<string[]>([])

  const [sections, setSections] = useState<FormSection[]>([
    {
      id: "sec-1",
      title: "Campos",
      fields: [],
    },
  ])

  const companyOptions = useMemo(
    () => companies.map((c) => ({ value: c.id, label: c.name })),
    [companies]
  )

  // Field dialog
  const [openField, setOpenField] = useState(false)
  const [fieldLabel, setFieldLabel] = useState("")
  const [fieldType, setFieldType] = useState<FormField["type"]>("text")
  const [fieldRequired, setFieldRequired] = useState(false)
  const [fieldOptions, setFieldOptions] = useState("")
  const [fieldUnit, setFieldUnit] = useState("")
  const [fieldMin, setFieldMin] = useState("")
  const [fieldMax, setFieldMax] = useState("")
  const [fieldMaxTimeFromFieldId, setFieldMaxTimeFromFieldId] = useState("")
  const [fieldMaxTimeOffsetMinutes, setFieldMaxTimeOffsetMinutes] = useState("0")
  const [fieldDependsOnSelectFieldId, setFieldDependsOnSelectFieldId] = useState("")
  const [fieldDependsOnSelectValue, setFieldDependsOnSelectValue] = useState("Sim")
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser || !["SUPER_ADMIN", "NUTRI_ADMIN"].includes(currentUser.role)) {
      router.replace("/dashboard")
    }
  }, [currentUser, router])

  if (!currentUser || !["SUPER_ADMIN", "NUTRI_ADMIN"].includes(currentUser.role)) return null

  function addField() {
    const label = fieldLabel.trim()
    if (!label) return
    const id = editingFieldId || slugify(label) || `campo_${generateId()}`
    const f: FormField = {
      id,
      label,
      type: fieldType,
      required: fieldRequired,
      options:
        fieldType === "select"
          ? fieldOptions
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      unit: fieldType === "temperature" ? "°C" : fieldUnit.trim() || undefined,
      width: "half",
      min: fieldType === "number" || fieldType === "temperature" ? Number(fieldMin || "") || undefined : undefined,
      max: fieldType === "number" || fieldType === "temperature" ? Number(fieldMax || "") || undefined : undefined,
      maxTimeFromFieldId: fieldType === "time" ? fieldMaxTimeFromFieldId || undefined : undefined,
      maxTimeOffsetMinutes: fieldType === "time" ? Number(fieldMaxTimeOffsetMinutes || "0") : undefined,
      dependsOnSelectFieldId: fieldDependsOnSelectFieldId || undefined,
      dependsOnSelectValue: fieldDependsOnSelectFieldId ? fieldDependsOnSelectValue : undefined,
    }

    setSections((prev) => {
      const next = [...prev]
      next[0] = {
        ...next[0],
        fields: editingFieldId
          ? next[0].fields.map((item) => (item.id === editingFieldId ? f : item))
          : [...next[0].fields, f],
      }
      return next
    })

    setFieldLabel("")
    setFieldType("text")
    setFieldRequired(false)
    setFieldOptions("")
    setFieldUnit("")
    setFieldMin("")
    setFieldMax("")
    setFieldMaxTimeFromFieldId("")
    setFieldMaxTimeOffsetMinutes("0")
    setFieldDependsOnSelectFieldId("")
    setFieldDependsOnSelectValue("Sim")
    setEditingFieldId(null)
    setOpenField(false)
  }

  function startEditField(fieldId: string) {
    const field = sections[0].fields.find((f) => f.id === fieldId)
    if (!field) return
    setEditingFieldId(field.id)
    setFieldLabel(field.label)
    setFieldType(field.type)
    setFieldRequired(field.required)
    setFieldOptions(field.options?.join(", ") || "")
    setFieldUnit(field.unit || "")
    setFieldMin(field.min?.toString() || "")
    setFieldMax(field.max?.toString() || "")
    setFieldMaxTimeFromFieldId(field.maxTimeFromFieldId || "")
    setFieldMaxTimeOffsetMinutes(String(field.maxTimeOffsetMinutes ?? 0))
    setFieldDependsOnSelectFieldId(field.dependsOnSelectFieldId || "")
    setFieldDependsOnSelectValue(field.dependsOnSelectValue || "Sim")
    setOpenField(true)
  }

  function moveFieldByDrag(targetFieldId: string) {
    if (!draggingFieldId || draggingFieldId === targetFieldId) return
    setSections((prev) => {
      const list = [...prev[0].fields]
      const from = list.findIndex((f) => f.id === draggingFieldId)
      const to = list.findIndex((f) => f.id === targetFieldId)
      if (from < 0 || to < 0) return prev
      const [item] = list.splice(from, 1)
      list.splice(to, 0, item)
      return [{ ...prev[0], fields: list }]
    })
  }

  function removeField(fieldId: string) {
    setSections((prev) => {
      const next = [...prev]
      next[0] = { ...next[0], fields: next[0].fields.filter((f) => f.id !== fieldId) }
      return next
    })
  }

  function handleSave() {
    const n = name.trim()
    if (!n) return
    const sn = (shortName.trim() || n).trim()
    const tpl: FormTemplate = {
      id: `tpl-${generateId()}`,
      name: n,
      shortName: sn,
      type: type.trim() || "custom",
      version: version.trim() || "1.0",
      description: description.trim(),
      sections,
      supportsMultipleRows: true,
      createdAt: new Date().toISOString(),
      companyIds: companyIds.length > 0 ? companyIds : [],
    }
    createGlobalTemplate(tpl)
    refreshTemplates()
    toast({ title: "Planilha criada", description: "A nova planilha foi salva com sucesso." })
    router.push(`/admin/planilhas/${tpl.id}`)
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Nova planilha</h1>
          <p className="text-sm text-muted-foreground">Crie um template global e escolha quais empresas terao acesso</p>
        </div>
        <Button variant="secondary" className="gap-2" onClick={() => router.push("/admin/planilhas")}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da planilha</CardTitle>
          <CardDescription>Essas informacoes aparecem na lista de formularios</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); if (!shortName) setShortName(e.target.value) }} placeholder="Ex: Monitoramento de Manutencao e Distribuicao de Alimentos" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Nome curto</Label>
              <Input value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="Ex: Manutencao/Distribuicao" />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="custom" />
            </div>
            <div className="grid gap-2">
              <Label>Versao</Label>
              <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Descricao</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o objetivo do registro..." />
          </div>

          <div className="grid gap-2">
            <Label>Empresas habilitadas (multi-selecao)</Label>
            <MultiSelect options={companyOptions} value={companyIds} onChange={setCompanyIds} placeholder="Selecione uma ou mais empresas" />
            <p className="text-xs text-muted-foreground">Se voce nao selecionar nenhuma, a planilha ficara disponivel para todas as empresas (MVP).</p>
          </div>

          <Button className="gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Criar planilha
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campos</CardTitle>
          <CardDescription>Colunas fixas do registro</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Dialog open={openField} onOpenChange={setOpenField}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 self-start"
                onClick={() => {
                  setEditingFieldId(null)
                  setFieldLabel("")
                  setFieldType("text")
                  setFieldRequired(false)
                  setFieldOptions("")
                  setFieldUnit("")
                  setFieldMin("")
                  setFieldMax("")
                  setFieldMaxTimeFromFieldId("")
                  setFieldMaxTimeOffsetMinutes("0")
    setFieldDependsOnSelectFieldId("")
    setFieldDependsOnSelectValue("Sim")
                }}
              >
                <Plus className="h-4 w-4" />
                Adicionar campo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingFieldId ? "Editar campo" : "Novo campo"}</DialogTitle>
                <DialogDescription>Crie uma coluna fixa para a planilha.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 py-2">
                <div className="grid gap-2">
                  <Label>Label</Label>
                  <Input value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)} placeholder="Ex: Temperatura (°C)" />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={fieldType} onValueChange={(v) => setFieldType(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Obrigatorio</p>
                    </div>
                    <Switch checked={fieldRequired} onCheckedChange={setFieldRequired} />
                  </div>
                </div>

                {fieldType === "select" && (
                  <div className="grid gap-2">
                    <Label>Opcoes (separadas por virgula)</Label>
                    <Input value={fieldOptions} onChange={(e) => setFieldOptions(e.target.value)} placeholder="Opcao A, Opcao B, Opcao C" />
                  </div>
                )}

                {(fieldType === "number" || fieldType === "temperature") && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <Label>Minimo</Label>
                      <Input type="number" value={fieldMin} onChange={(e) => setFieldMin(e.target.value)} placeholder="Ex: -5" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Maximo</Label>
                      <Input type="number" value={fieldMax} onChange={(e) => setFieldMax(e.target.value)} placeholder="Ex: 10" />
                    </div>
                  </div>
                )}

                {fieldType === "time" && (
                  <div className="grid gap-2 rounded-lg border p-3">
                    <Label>Regra de dependencia de horario</Label>
                    <Select value={fieldMaxTimeFromFieldId || "none"} onValueChange={(v) => setFieldMaxTimeFromFieldId(v === "none" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sem dependencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem dependencia</SelectItem>
                        {sections[0].fields.filter((f) => f.id !== editingFieldId && f.type === "time").map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid gap-2">
                      <Label>Limite em minutos apos o campo de referencia</Label>
                      <Input type="number" value={fieldMaxTimeOffsetMinutes} onChange={(e) => setFieldMaxTimeOffsetMinutes(e.target.value)} />
                    </div>
                  </div>
                )}


                <div className="grid gap-2 rounded-lg border p-3">
                  <Label>Dependencia por selecao</Label>
                  <Select value={fieldDependsOnSelectFieldId || "none"} onValueChange={(v) => setFieldDependsOnSelectFieldId(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sem dependencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem dependencia</SelectItem>
                      {sections[0].fields.filter((f) => f.id !== editingFieldId && f.type === "select").map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldDependsOnSelectFieldId && (
                    <Select value={fieldDependsOnSelectValue} onValueChange={setFieldDependsOnSelectValue}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sim">Sim</SelectItem>
                        <SelectItem value="Nao">Nao</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">Quando a selecao escolhida for igual ao valor acima, este campo fica bloqueado em cinza claro.</p>
                </div>

                {fieldType !== "temperature" && fieldType !== "select" && (
                  <div className="grid gap-2">
                    <Label>Unidade (opcional)</Label>
                    <Input value={fieldUnit} onChange={(e) => setFieldUnit(e.target.value)} placeholder="Ex: kg, L, %" />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="secondary" onClick={() => setOpenField(false)}>Cancelar</Button>
                <Button onClick={addField}>{editingFieldId ? "Salvar alteracoes" : "Adicionar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {sections[0].fields.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum campo ainda. Adicione os campos para montar as colunas fixas.
            </div>
          ) : (
            <div className="grid gap-2">
              {sections[0].fields.map((f) => (
                <div
                  key={f.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition-colors hover:bg-muted/40"
                  draggable
                  onDragStart={() => setDraggingFieldId(f.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => moveFieldByDrag(f.id)}
                  onDragEnd={() => setDraggingFieldId(null)}
                >
                  <button type="button" className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left" onClick={() => startEditField(f.id)}>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <p className="truncate text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.id} • {f.type}{f.required ? " • obrigatorio" : ""}</p>
                  </button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeField(f.id)} aria-label="Remover">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
