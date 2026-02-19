"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, FileSpreadsheet, Eye, Save } from "lucide-react"
import { createGlobalTemplate, generateId } from "@/lib/store"
import { parseTemplateXlsx, type ParsedXlsxTemplate } from "@/lib/xlsx-template-import"
import type { FormTemplate } from "@/lib/types"
import { toast } from "@/hooks/use-toast"

const cellGuide = [
  ["B2", "Nome da planilha", "Obrigatorio"],
  ["B3", "Nome curto", "Opcional"],
  ["B4", "Tipo", "Opcional (padrao: custom)"],
  ["B5", "Versao", "Opcional (padrao: 1.0)"],
  ["B6", "Descricao", "Opcional"],
] as const

const headerGuide = [
  ["A10", "label", "Nome exibido no formulario"],
  ["B10", "tipo", "text | textarea | number | temperature | time | date | select | checkbox"],
  ["C10", "obrigatorio", "Sim/Nao"],
  ["D10", "id", "Opcional; se vazio, e gerado automaticamente"],
  ["E10", "placeholder", "Opcional"],
  ["F10", "opcoes", "Para select, separar por | (ex: Bom|Regular|Ruim)"],
  ["G10", "unidade", "Opcional (ex: kg, L, %)"],
  ["H10", "min", "Opcional (numero)"],
  ["I10", "max", "Opcional (numero)"],
] as const

export default function ImportarPlanilhaPage() {
  const router = useRouter()
  const { currentUser, refreshTemplates } = useApp()
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedXlsxTemplate | null>(null)

  useEffect(() => {
    if (!currentUser || !["SUPER_ADMIN", "NUTRI_ADMIN"].includes(currentUser.role)) {
      router.replace("/dashboard")
    }
  }, [currentUser, router])

  const previewFields = useMemo(() => parsed?.template.sections[0]?.fields ?? [], [parsed])

  if (!currentUser || !["SUPER_ADMIN", "NUTRI_ADMIN"].includes(currentUser.role)) return null

  async function handleFileUpload(file: File) {
    setError(null)
    setParsed(null)
    setFileName(file.name)

    try {
      const buffer = await file.arrayBuffer()
      const result = parseTemplateXlsx(buffer)
      setParsed(result)
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Falha ao processar planilha."
      setError(message)
    }
  }

  function handleCreateTemplate() {
    if (!parsed) return

    const tpl: FormTemplate = {
      id: `tpl-${generateId()}`,
      createdAt: new Date().toISOString(),
      ...parsed.template,
    }

    createGlobalTemplate(tpl)
    refreshTemplates()
    toast({ title: "Importacao concluida", description: "Planilha importada e salva com sucesso." })
    router.push(`/admin/planilhas/${tpl.id}`)
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Importar planilha XLSX</h1>
          <p className="text-sm text-muted-foreground">
            Envie um arquivo .xlsx com layout padronizado para criar um template sem retrabalho. Nenhum campo pode ter nome igual.
          </p>
        </div>
        <Button variant="secondary" className="gap-2" onClick={() => router.push("/admin/planilhas")}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1) Estrutura obrigatoria da planilha</CardTitle>
          <CardDescription>
            Use a primeira aba do arquivo. As celulas abaixo precisam conter os metadados.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Celula</TableHead>
                <TableHead>Conteudo esperado</TableHead>
                <TableHead>Regra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cellGuide.map(([cell, content, rule]) => (
                <TableRow key={cell}>
                  <TableCell className="font-mono text-xs">{cell}</TableCell>
                  <TableCell>{content}</TableCell>
                  <TableCell className="text-muted-foreground">{rule}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertTitle>Campos a partir da linha 11</AlertTitle>
            <AlertDescription>
              A linha 10 deve ser o cabecalho tecnico (A10 ate I10). Os campos devem iniciar em A11 e seguir uma linha por campo.
            </AlertDescription>
          </Alert>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Celula</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead>Descricao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {headerGuide.map(([cell, key, description]) => (
                <TableRow key={cell}>
                  <TableCell className="font-mono text-xs">{cell}</TableCell>
                  <TableCell><Badge variant="secondary">{key}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2) Upload e validacao</CardTitle>
          <CardDescription>Selecione um arquivo .xlsx para importar e validar os campos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Input
            type="file"
            accept=".xlsx"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) handleFileUpload(file)
            }}
          />
          {fileName && <p className="text-xs text-muted-foreground">Arquivo selecionado: {fileName}</p>}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Erro de importacao</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {parsed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              3) Pre-visualizacao para confirmacao
            </CardTitle>
            <CardDescription>
              Revise exatamente o que sera criado antes de confirmar a importacao.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1 rounded-lg border p-3 text-sm">
              <p><span className="font-medium">Nome:</span> {parsed.template.name}</p>
              <p><span className="font-medium">Nome curto:</span> {parsed.template.shortName}</p>
              <p><span className="font-medium">Tipo:</span> {parsed.template.type}</p>
              <p><span className="font-medium">Versao:</span> {parsed.template.version}</p>
            </div>

            {parsed.warnings.length > 0 && (
              <Alert>
                <AlertTitle>Avisos de importacao ({parsed.warnings.length})</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 text-xs">
                    {parsed.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Obrigatorio</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Opcoes/Unidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewFields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.label}</TableCell>
                    <TableCell><Badge variant="outline">{field.type}</Badge></TableCell>
                    <TableCell>{field.required ? "Sim" : "Nao"}</TableCell>
                    <TableCell className="font-mono text-xs">{field.id}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {field.options?.join(" | ") || field.unit || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Button className="gap-2" onClick={handleCreateTemplate}>
              <Save className="h-4 w-4" />
              Confirmar importacao e criar planilha
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
