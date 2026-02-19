"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { ArrowLeft, Plus, Save, Trash2, ChevronUp, ChevronDown, FileSpreadsheet } from "lucide-react"
import type { FormField, FormSection, FormTemplate } from "@/lib/types"
import { updateGlobalTemplate, deleteGlobalTemplate, generateId } from "@/lib/store"
import { MultiSelect } from "@/components/multi-select"

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

export default function EditarPlanilhaPage() {
  const router = useRouter()
  const params = useParams<{ templateId: string }>()
  const templateId = params.templateId

  const { currentUser, templates, companies, refreshTemplates } = useApp()

  const template = useMemo(() => templates.find((t) => t.id === templateId), [templates, templateId])

  const [name, setName] = useState("")
  const [shortName, setShortName] = useState("")
  const [type, setType] = useState("custom")
  const [version, setVersion] = useState("1.0")
  const [description, setDescription] = useState("")
  const [supportsMultipleRows, setSupportsMultipleRows] = useState(true)
  const [companyIds, setCompanyIds] = useState<string[]>([])
  const [sections, setSections] = useState<FormSection[]>([{ id: "sec-1", title: "Campos", fields: [] }])

  const companyOptions = useMemo(
    () => companies.map((c) => ({ value: c.id, label: c.name })),
    [companies]
  )

  useEffect(() => {
    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      router.replace("/dashboard")
      return
    }
  }, [currentUser, router])

  useEffect(() => {
    if (!template) return
    setName(template.name)
    setShortName(template.shortName)
    setType(template.type)
    setVersion(template.version)
    setDescription(template.description)
    setSupportsMultipleRows(template.supportsMultipleRows)
    setCompanyIds(template.companyIds ?? [])
    setSections(template.sections?.length ? template.sections : [{ id: "sec-1", title: "Campos", fields: [] }])
  }, [template])

  // Field dialog
  const [openField, setOpenField] = useState(false)
  const [fieldLabel, setFieldLabel] = useState("")
  const [fieldType, setFieldType] = useState<FormField["type"]>("text")
  const [fieldRequired, setFieldRequired] = useState(false)
  const [fieldOptions, setFieldOptions] = useState("")
  const [fieldUnit, setFieldUnit] = useState("")

  if (!currentUser || currentUser.role !== "SUPER_ADMIN") return null
  if (!template) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <p className="text-sm text-muted-foreground">Planilha nao encontrada.</p>
        <Button variant="secondary" onClick={() => router.push("/admin/planilhas")}>Voltar</Button>
      </div>
    )
  }

  function addField() {
    const label = fieldLabel.trim()
    if (!label) return
    const id = slugify(label) || `campo_${generateId()}`
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
    }

    setSections((prev) => {
      const next = [...prev]
      const first = next[0] ?? { id: "sec-1", title: "Campos", fields: [] }
      next[0] = { ...first, fields: [...first.fields, f] }
      return next
    })

    setFieldLabel("")
    setFieldType("text")
    setFieldRequired(false)
    setFieldOptions("")
    setFieldUnit("")
    setOpenField(false)
  }

  function removeField(fieldId: string) {
    setSections((prev) => {
      const next = [...prev]
      const first = next[0] ?? { id: "sec-1", title: "Campos", fields: [] }
      next[0] = { ...first, fields: first.fields.filter((f) => f.id !== fieldId) }
      return next
    })
  }

  function moveField(fieldId: string, direction: "up" | "down") {
    setSections((prev) => {
      const next = [...prev]
      const first = next[0] ?? { id: "sec-1", title: "Campos", fields: [] }
      const idx = first.fields.findIndex((f) => f.id === fieldId)
      if (idx === -1) return prev
      const target = direction === "up" ? idx - 1 : idx + 1
      if (target < 0 || target >= first.fields.length) return prev
      const fields = [...first.fields]
      const [item] = fields.splice(idx, 1)
      fields.splice(target, 0, item)
      next[0] = { ...first, fields }
      return next
    })
  }

  function handleSave() {
    const n = name.trim()
    if (!n) return

    const updated: FormTemplate = {
      ...template,
      name: n,
      shortName: shortName.trim() || n,
      type: type.trim() || "custom",
      version: version.trim() || "1.0",
      description: description.trim(),
      supportsMultipleRows,
      sections,
      companyIds: companyIds.length > 0 ? companyIds : [],
    }
    updateGlobalTemplate(updated)
    refreshTemplates()
  }

  function handleDelete() {
    deleteGlobalTemplate(template.id)
    refreshTemplates()
    router.push("/admin/planilhas")
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Editar planilha</h1>
          <p className="text-sm text-muted-foreground">ID: {template.id}</p>
        </div>
        <Button variant="secondary" className="gap-2" onClick={() => router.push("/admin/planilhas")}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => router.push(`/admin/planilhas/${template.id}/exportacao`)}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Editar exportacao
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button className="gap-2" onClick={handleSave}>
          <Save className="h-4 w-4" />
          Salvar
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir planilha?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso removera o template e tambem todos os registros vinculados a ele.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da planilha</CardTitle>
          <CardDescription>Controle quais empresas podem ver esta planilha</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Nome curto</Label>
              <Input value={shortName} onChange={(e) => setShortName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Input value={type} onChange={(e) => setType(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Versao</Label>
              <Input value={version} onChange={(e) => setVersion(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Descricao</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Suporta multiplos registros</p>
              <p className="text-xs text-muted-foreground">Varias linhas (data/hora/turno) por periodo</p>
            </div>
            <Switch checked={supportsMultipleRows} onCheckedChange={setSupportsMultipleRows} />
          </div>

          <div className="grid gap-2">
            <Label>Empresas habilitadas (multi-selecao)</Label>
            <MultiSelect options={companyOptions} value={companyIds} onChange={setCompanyIds} placeholder="Selecione uma ou mais empresas" />
            <p className="text-xs text-muted-foreground">Se vazio, fica disponivel para todas as empresas (MVP).</p>
          </div>
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
              <Button variant="outline" className="gap-2 self-start">
                <Plus className="h-4 w-4" />
                Adicionar campo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo campo</DialogTitle>
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
                    <Input value={fieldOptions} onChange={(e) => setFieldOptions(e.target.value)} placeholder="Opcao A, Opcao B" />
                  </div>
                )}

                {fieldType !== "temperature" && fieldType !== "select" && (
                  <div className="grid gap-2">
                    <Label>Unidade (opcional)</Label>
                    <Input value={fieldUnit} onChange={(e) => setFieldUnit(e.target.value)} placeholder="Ex: kg, L, %" />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="secondary" onClick={() => setOpenField(false)}>Cancelar</Button>
                <Button onClick={addField}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {sections[0]?.fields?.length ? (
            <div className="grid gap-2">
              {sections[0].fields.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.id} • {f.type}{f.required ? " • obrigatorio" : ""}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveField(f.id, "up")}
                      aria-label="Mover para cima"
                    >
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveField(f.id, "down")}
                      aria-label="Mover para baixo"
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeField(f.id)} aria-label="Remover">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum campo ainda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
