"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Building2, Ship, Plus, Save, Trash2, ClipboardList } from "lucide-react"
import type { Vessel } from "@/lib/types"
import { addVessel, deleteCompany, generateId, getCompanyById, updateCompany } from "@/lib/store"

export default function AdminEmpresaDetailPage() {
  const router = useRouter()
  const params = useParams<{ companyId: string }>()
  const companyId = params.companyId
  const { currentUser, companies, vessels, refreshCompanies, refreshTemplates } = useApp()

  const company = useMemo(
    () => companies.find((c) => c.id === companyId) ?? getCompanyById(companyId),
    [companies, companyId]
  )

  const [openVessel, setOpenVessel] = useState(false)
  const [vesselName, setVesselName] = useState("")
  const [companyName, setCompanyName] = useState(company?.name ?? "")

  useEffect(() => {
    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      router.replace("/dashboard")
    }
  }, [currentUser, router])

  useEffect(() => {
    if (company) setCompanyName(company.name)
  }, [company])

  const companyVessels = useMemo(
    () => vessels.filter((v) => v.companyId === companyId),
    [vessels, companyId]
  )

  if (!currentUser || currentUser.role !== "SUPER_ADMIN") return null
  if (!company) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Empresa nao encontrada.</p>
      </div>
    )
  }

  function handleCreateVessel() {
    const trimmed = vesselName.trim()
    if (!trimmed) return
    const v: Vessel = { id: `v-${generateId()}`, name: trimmed, companyId }
    addVessel(v)
    router.refresh()
    setVesselName("")
    setOpenVessel(false)
  }

  function handleSaveCompany() {
    const trimmed = companyName.trim()
    if (!trimmed) return
    updateCompany({ ...company, name: trimmed })
    refreshCompanies()
  }

  function handleDeleteCompany() {
    deleteCompany(companyId)
    refreshCompanies()
    refreshTemplates()
    router.push("/admin/empresas")
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">{company.name}</h1>
            <p className="text-sm text-muted-foreground">Admin global • gerenciamento completo</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => router.push("/admin/empresas")}>Voltar</Button>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList>
          <TabsTrigger value="empresa" className="gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="vessels" className="gap-2">
            <Ship className="h-4 w-4" />
            Embarcacoes
          </TabsTrigger>
          <TabsTrigger value="planilhas" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Planilhas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados da empresa</CardTitle>
              <CardDescription>Edite o nome ou exclua a empresa (remove embarcacoes/relatorios vinculados)</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button className="gap-2" onClick={handleSaveCompany}>
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Excluir empresa
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso removera a empresa, embarcacoes associadas e registros relacionados. Usuarios dessa empresa serao desvinculados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteCompany}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="text-xs text-muted-foreground">
                ID: {company.id}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vessels" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Embarcacoes</CardTitle>
              <CardDescription>Crie e liste embarcacoes vinculadas a esta empresa</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Dialog open={openVessel} onOpenChange={setOpenVessel}>
                <DialogTrigger asChild>
                  <Button className="gap-2 self-start">
                    <Plus className="h-4 w-4" />
                    Nova embarcacao
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar embarcacao</DialogTitle>
                    <DialogDescription>Vincule uma nova embarcacao a esta empresa.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 py-2">
                    <Label>Nome</Label>
                    <Input value={vesselName} onChange={(e) => setVesselName(e.target.value)} placeholder="Ex: PSV Alpha" />
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpenVessel(false)}>Cancelar</Button>
                    <Button onClick={handleCreateVessel}>Criar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="grid gap-2">
                {companyVessels.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{v.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {v.id}</p>
                    </div>
                  </div>
                ))}

                {companyVessels.length === 0 && (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Nenhuma embarcacao cadastrada.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planilhas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Planilhas habilitadas</CardTitle>
              <CardDescription>
                A habilitacao agora e feita na propria planilha (Admin &gt; Planilhas), selecionando as empresas em multi-selecao.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => router.push("/admin/planilhas")}>
                Ir para gerenciamento de planilhas
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
