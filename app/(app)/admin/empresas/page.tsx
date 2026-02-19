"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
import { Building2, Plus, ArrowRight } from "lucide-react"
import type { Company } from "@/lib/types"
import { createCompany, generateId } from "@/lib/store"

export default function AdminEmpresasPage() {
  const router = useRouter()
  const { currentUser, companies, refreshCompanies } = useApp()

  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")

  useEffect(() => {
    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      router.replace("/dashboard")
    }
  }, [currentUser, router])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return companies
    return companies.filter((c) => c.name.toLowerCase().includes(q))
  }, [companies, search])

  if (!currentUser || currentUser.role !== "SUPER_ADMIN") return null

  function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return
    const company: Company = {
      id: `c-${generateId()}`,
      name: trimmed,
      createdAt: new Date().toISOString(),
    }
    createCompany(company)
    refreshCompanies()
    setName("")
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Empresas</h1>
            <p className="text-sm text-muted-foreground">Admin global - gerencie empresas e vinculos</p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar empresa</DialogTitle>
              <DialogDescription>Cadastre uma nova empresa para isolar embarcacoes e relatorios.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: SEANUTRI" />
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar empresa..." />

      <div className="grid gap-3">
        {filtered.map((c) => (
          <Card
            key={c.id}
            className="hover:bg-muted/30 cursor-pointer"
            onClick={() => router.push(`/admin/empresas/${c.id}`)}
          >
            <CardHeader className="py-4">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {c.name}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription className="text-xs">ID: {c.id}</CardDescription>
            </CardHeader>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma empresa encontrada.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
