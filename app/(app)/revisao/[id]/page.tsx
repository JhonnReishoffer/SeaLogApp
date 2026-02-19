"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { FormRowRenderer } from "@/components/form-renderer"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { CheckCircle, RotateCcw, Clock, ArrowLeft } from "lucide-react"

export default function ReviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentUser, entries, templates, updateEntry } = useApp()

  const entryId = params.id as string
  const entry = entries.find((e) => e.id === entryId)
  const template = entry
    ? templates.find((t) => t.id === entry.templateId)
    : null

  const [correctionNote, setCorrectionNote] = useState("")

  if (!entry || !template) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-muted-foreground">Registro nao encontrado</p>
        <Button onClick={() => router.back()} className="select-none">
          Voltar
        </Button>
      </div>
    )
  }

  function handleApprove() {
    if (!entry || !currentUser) return
    const now = new Date().toISOString()
    updateEntry({
      ...entry,
      status: "aprovada",
      reviewHistory: [
        ...entry.reviewHistory,
        {
          action: "aprovada",
          by: currentUser.id,
          byName: currentUser.name,
          date: now,
        },
      ],
      updatedAt: now,
    })
    router.push("/revisao")
  }

  function handleRevisada() {
    if (!entry || !currentUser) return
    const now = new Date().toISOString()
    const dateStr = new Date().toLocaleDateString("pt-BR")
    updateEntry({
      ...entry,
      status: "revisada",
      reviewHistory: [
        ...entry.reviewHistory,
        {
          action: "revisada",
          by: currentUser.id,
          byName: currentUser.name,
          date: now,
          note: `Revisada em ${dateStr}`,
        },
      ],
      updatedAt: now,
    })
    router.push("/revisao")
  }

  function handleRequestCorrection() {
    if (!entry || !currentUser || !correctionNote.trim()) return
    const now = new Date().toISOString()
    updateEntry({
      ...entry,
      status: "rascunho",
      reviewHistory: [
        ...entry.reviewHistory,
        {
          action: "correcao",
          by: currentUser.id,
          byName: currentUser.name,
          date: now,
          note: correctionNote.trim(),
        },
      ],
      updatedAt: now,
    })
    setCorrectionNote("")
    router.push("/revisao")
  }

  const canReview = entry.status === "em_revisao"

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-balance">{template.name}</h1>
          <p className="text-sm text-muted-foreground">
            {entry.vesselName} - Periodo: {entry.period}
          </p>
          <p className="text-xs text-muted-foreground">
            Enviado por: {entry.userName}
          </p>
        </div>
        <StatusBadge status={entry.status} />
      </div>

      {/* Rows (read-only) */}
      <div className="flex flex-col gap-4">
        {entry.rows.map((row, index) => (
          <Card key={row.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Registro {index + 1}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {template.sections.map((section) => (
                <div key={section.id}>
                  <FormRowRenderer
                    fields={section.fields}
                    row={row}
                    onChange={() => {}}
                    disabled
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review History */}
      {entry.reviewHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Historico de Revisao
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {entry.reviewHistory.map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm"
              >
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-medium">
                    {h.action === "enviado" && "Enviado para revisao"}
                    {h.action === "revisada" && "Revisado"}
                    {h.action === "aprovada" && "Aprovado"}
                    {h.action === "correcao" && "Correcao solicitada"}
                    <span className="ml-1 font-normal text-muted-foreground">
                      por {h.byName}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.date).toLocaleString("pt-BR")}
                  </p>
                  {h.note && (
                    <p className="mt-1 text-xs text-foreground">{h.note}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Review actions */}
      {canReview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Acoes de Revisao
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              {/* Approve */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="flex-1 select-none gap-2 bg-green-600 text-white hover:bg-green-700">
                    <CheckCircle className="h-4 w-4" />
                    Aprovar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Aprovar formulario?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apos aprovado, o formulario nao podera mais ser editado.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="select-none">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="select-none bg-green-600 text-white hover:bg-green-700"
                      onClick={handleApprove}
                    >
                      Confirmar Aprovacao
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Mark as reviewed */}
              <Button
                variant="outline"
                className="flex-1 select-none gap-2"
                onClick={handleRevisada}
              >
                <RotateCcw className="h-4 w-4" />
                Marcar Revisada
              </Button>
            </div>

            {/* Request correction */}
            <div className="flex flex-col gap-2 border-t pt-4">
              <label className="text-sm font-medium text-muted-foreground">
                Solicitar Correcao
              </label>
              <Textarea
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                placeholder="Descreva o que precisa ser corrigido..."
                rows={3}
                className="text-base"
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="select-none gap-2"
                    disabled={!correctionNote.trim()}
                  >
                    Solicitar Correcao
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Solicitar correcao?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      O formulario voltara para rascunho e o autor podera
                      edita-lo novamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="select-none">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="select-none"
                      onClick={handleRequestCorrection}
                    >
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back button */}
      <Button
        variant="ghost"
        className="select-none gap-2"
        onClick={() => router.push("/revisao")}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Lista
      </Button>
    </div>
  )
}
