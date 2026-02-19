"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
import {
  Sun,
  Moon,
  Monitor,
  Type,
  Bell,
  Database,
  Info,
  Trash2,
  Shield,
} from "lucide-react"
import { clearAllData } from "@/lib/store"

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme()
  const { currentUser } = useApp()
  const [fontSize, setFontSize] = useState("normal")
  const [notifications, setNotifications] = useState(true)

  function handleClearData() {
    clearAllData()
    window.location.href = "/login"
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-xl font-bold">Configuracoes</h1>
        <p className="text-sm text-muted-foreground">
          Ajuste as preferencias do aplicativo
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sun className="h-4 w-4" />
            Aparencia
          </CardTitle>
          <CardDescription>
            Personalize a aparencia do aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Tema</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className="select-none gap-2"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4" />
                Claro
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className="select-none gap-2"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4" />
                Escuro
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                className="select-none gap-2"
                onClick={() => setTheme("system")}
              >
                <Monitor className="h-4 w-4" />
                Auto
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm">Tamanho da Fonte</Label>
            </div>
            <Select value={fontSize} onValueChange={setFontSize}>
              <SelectTrigger className="w-32 select-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequeno</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Notificacoes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Ativar notificacoes</Label>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Receba lembretes sobre formularios pendentes e revisoes.
          </p>
        </CardContent>
      </Card>

      {/* Data management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" />
            Gerenciamento de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Dados armazenados localmente
            </span>
            <span className="font-medium">Ativo</span>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full select-none gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Todos os Dados
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar todos os dados?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isto removera todos os formularios, modelos, embarcacoes e
                  dados de usuarios armazenados neste dispositivo. Esta acao
                  nao pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="select-none">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  className="select-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleClearData}
                >
                  Limpar Dados
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Security */}
      {currentUser?.role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Administracao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full select-none"
              onClick={() => (window.location.href = "/admin/usuarios")}
            >
              Gerenciar Usuarios
            </Button>
          </CardContent>
        </Card>
      )}

      {/* App info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            Sobre o Aplicativo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Versao</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nome</span>
            <span>SeaLogApp</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Framework</span>
            <span>Next.js 16</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Armazenamento</span>
            <span>Local (Navegador)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
