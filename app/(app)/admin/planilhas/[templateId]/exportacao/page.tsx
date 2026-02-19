"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ChevronDown, ChevronUp, Save, RotateCcw } from "lucide-react"
import type { FormTemplate } from "@/lib/types"
import { updateGlobalTemplate } from "@/lib/store"

function uniq(list: string[]) {
  return Array.from(new Set(list))
}

export default function ExportacaoPlanilhaPage() {
  const router = useRouter()
  const params = useParams<{ templateId: string }>()
  const templateId = params.templateId

  const { currentUser, templates, refreshTemplates } = useApp()
  const template = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId]
  )

  const fields = useMemo(() => {
    const t = template
    if (!t) return []
    return t.sections.flatMap((s) => s.fields)
  }, [template])

  const [included, setIncluded] = useState<string[]>([])
  const [order, setOrder] = useState<string[]>([])

  useEffect(() => {
    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      router.replace("/dashboard")
      return
    }
  }, [currentUser, router])

  useEffect(() => {
    if (!template) return
    const allIds = fields.map((f) => f.id)
    const inc = template.exportConfig?.includedFieldIds?.length
      ? template.exportConfig.includedFieldIds
      : allIds
    const ord = template.exportConfig?.fieldOrder?.length
      ? template.exportConfig.fieldOrder
      : allIds
    setIncluded(uniq(inc.filter((id) => allIds.includes(id))))
    setOrder(uniq(ord.filter((id) => allIds.includes(id))))
  }, [template, fields])

  if (!currentUser || currentUser.role !== "SUPER_ADMIN") return null
  if (!template) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <p className="text-sm text-muted-foreground">Planilha nao encontrada.</p>
        <Button variant="secondary" onClick={() => router.push("/admin/planilhas")}>Voltar</Button>
      </div>
    )
  }

  function toggleField(fieldId: string, checked: boolean) {
    setIncluded((prev) => {
      if (checked) return uniq([...prev, fieldId])
      return prev.filter((id) => id !== fieldId)
    })
  }

  function move(fieldId: string, dir: "up" | "down") {
    setOrder((prev) => {
      const idx = prev.indexOf(fieldId)
      if (idx === -1) return prev
      const target = dir === "up" ? idx - 1 : idx + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  function reset() {
    const allIds = fields.map((f) => f.id)
    setIncluded(allIds)
    setOrder(allIds)
  }

  function save() {
    const allIds = fields.map((f) => f.id)
    const safeIncluded = included.length ? included.filter((id) => allIds.includes(id)) : allIds
    // Ensure order contains all ids (even excluded), then export will filter by included.
    const baseOrder = order.filter((id) => allIds.includes(id))
    const missing = allIds.filter((id) => !baseOrder.includes(id))
    const safeOrder = [...baseOrder, ...missing]

    const updated: FormTemplate = {
      ...template,
      exportConfig: {
        includedFieldIds: safeIncluded,
        fieldOrder: safeOrder,
      },
    }
    updateGlobalTemplate(updated)
    refreshTemplates()
  }

  // Render fields in current order
  const orderedFields = useMemo(() => {
    const map = new Map(fields.map((f) => [f.id, f]))
    const ids = order.length ? order : fields.map((f) => f.id)
    return ids.map((id) => map.get(id)).filter(Boolean) as typeof fields
  }, [fields, order])

  return (
    <div className="flex flex-col gap-6 p-4 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Exportacao</h1>
          <p className="text-sm text-muted-foreground">{template.name}</p>
        </div>
        <Button
          variant="secondary"
          className="gap-2"
          onClick={() => router.push(`/admin/planilhas/${template.id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button className="gap-2" onClick={save}>
          <Save className="h-4 w-4" />
          Salvar
        </Button>
        <Button variant="outline" className="gap-2" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Resetar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campos exportados</CardTitle>
          <CardDescription>
            Marque quais colunas vao para o Excel e ajuste a ordem.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {orderedFields.length ? (
            orderedFields.map((f) => {
              const isChecked = included.includes(f.id)
              return (
                <div key={f.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(v) => toggleField(f.id, Boolean(v))}
                      aria-label={`Exportar ${f.label}`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.id} • {f.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(f.id, "up")} aria-label="Mover para cima">
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(f.id, "down")} aria-label="Mover para baixo">
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum campo encontrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
