"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { User, Building2, Shield, Save, Trash2, Mail } from "lucide-react"

export default function PerfilPage() {
  const router = useRouter()
  const { currentUser, updateCurrentUser, deleteAccount, logout, companies } = useApp()

  const [name, setName] = useState(currentUser?.name || "")
  const [email, setEmail] = useState(currentUser?.email || "")
  const [saved, setSaved] = useState(false)

  if (!currentUser) return null

  function handleSave() {
    if (!currentUser || !name.trim()) return
    updateCurrentUser({
      ...currentUser,
      name: name.trim(),
      email: email.trim() || currentUser.email,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleDelete() {
    deleteAccount()
    router.replace("/login")
  }

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "Admin Global",
    COMPANY_ADMIN: "Admin Empresa",
    USER: "Usuario",
  }

  const companyName = currentUser.companyId
    ? companies.find((c) => c.id === currentUser.companyId)?.name
    : currentUser.role === "SUPER_ADMIN" ? "(Global)" : "(Sem empresa)"

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-xl font-bold">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie suas informacoes pessoais
        </p>
      </div>

      {/* User info card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{currentUser.name}</CardTitle>
              <CardDescription>{currentUser.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <Building2 className="h-3 w-3" />
            {companyName}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            {roleLabels[currentUser.role] || currentUser.role}
          </Badge>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editar Informacoes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSaved(false)
                }}
                className="pl-10"
                placeholder="Seu nome completo"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setSaved(false)
                }}
                className="pl-10"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Empresa</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={companyName}
                disabled
                className="pl-10 opacity-60"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A empresa nao pode ser alterada apos o cadastro inicial.
            </p>
          </div>

          <Button
            onClick={handleSave}
            className="select-none gap-2"
            disabled={!name.trim()}
          >
            <Save className="h-4 w-4" />
            {saved ? "Salvo!" : "Salvar Alteracoes"}
          </Button>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informacoes da Conta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Membro desde</span>
            <span>
              {new Date(currentUser.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nivel de acesso</span>
            <span>{roleLabels[currentUser.role] || currentUser.role}</span>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive-foreground">
            Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full select-none gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir Conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acao nao pode ser desfeita. Todos os seus dados
                  serao removidos permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="select-none">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  className="select-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDelete}
                >
                  Excluir Permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
