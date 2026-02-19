"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Users, Shield, Building2, User, Pencil, ShieldAlert } from "lucide-react"
import type { User as UserType, UserRole } from "@/lib/types"
import { updateUser, getUsers } from "@/lib/store"

export default function AdminUsuariosPage() {
  const router = useRouter()
  const { currentUser, allUsers, refreshUsers } = useApp()
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [editRole, setEditRole] = useState<UserRole>("USER")
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "COMPANY_ADMIN")) {
      router.replace("/dashboard")
    }
  }, [currentUser, router])

  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "COMPANY_ADMIN")) {
    return null
  }

  const visibleUsers =
    currentUser.role === "SUPER_ADMIN"
      ? allUsers
      : allUsers.filter((u) => u.companyId && u.companyId === currentUser.companyId)

  const filteredUsers = visibleUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.companyId ?? "").toLowerCase().includes(search.toLowerCase())
  )

  function handleEditUser(user: UserType) {
    setEditingUser(user)
    setEditRole(user.role)
  }

  function handleSaveRole() {
    if (!editingUser) return
    const updated = { ...editingUser, role: editRole }
    updateUser(updated)
    refreshUsers()
    setEditingUser(null)
  }

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "Admin Global",
    COMPANY_ADMIN: "Admin Empresa",
    USER: "Usuario",
  }

  const roleBadgeColors: Record<string, string> = {
    SUPER_ADMIN: "bg-red-500/20 text-red-500",
    COMPANY_ADMIN: "bg-blue-500/20 text-blue-500",
    USER: "bg-muted text-muted-foreground",
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Gerenciar Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Painel administrativo - Somente SEANUTRI
          </p>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar por nome, email ou empresa..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="text-base"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <p className="text-2xl font-bold">{allUsers.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <p className="text-2xl font-bold">{visibleUsers.filter((u) => u.role !== "USER").length}</p>
            <p className="text-xs text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <p className="text-2xl font-bold">
              {new Set(visibleUsers.map((u) => u.companyId).filter(Boolean)).size}
            </p>
            <p className="text-xs text-muted-foreground">Empresas</p>
          </CardContent>
        </Card>
      </div>

      {/* User list */}
      <div className="flex flex-col gap-2">
        {filteredUsers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-8">
              <Users className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhum usuario encontrado
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {user.name}
                      {user.id === currentUser.id && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (voce)
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {user.companyId && (
                        <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0">
                          <Building2 className="h-2.5 w-2.5" />
                          {user.companyId}
                        </Badge>
                      )}
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${roleBadgeColors[user.role]}`}
                      >
                        {roleLabels[user.role]}
                      </span>
                    </div>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 select-none"
                      onClick={() => handleEditUser(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Permissoes</DialogTitle>
                      <DialogDescription>
                        {user.name} - {user.email}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Label>Nivel de Acesso</Label>
                        <Select
                          value={editRole}
                          onValueChange={(v) => setEditRole(v as UserRole)}
                        >
                          <SelectTrigger className="select-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currentUser.role === "SUPER_ADMIN" && (
                              <SelectItem value="SUPER_ADMIN">Admin Global</SelectItem>
                            )}
                            <SelectItem value="COMPANY_ADMIN">Admin Empresa</SelectItem>
                            <SelectItem value="USER">Usuario</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1 text-sm">
                        <p className="text-muted-foreground">Empresa:</p>
                        <p className="font-medium">
                          {user.companyId || "Nao definida"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 text-sm">
                        <p className="text-muted-foreground">
                          Membro desde:
                        </p>
                        <p className="font-medium">
                          {new Date(user.createdAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleSaveRole}
                        className="select-none"
                      >
                        Salvar Alteracoes
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
