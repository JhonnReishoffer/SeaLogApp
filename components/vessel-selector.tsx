"use client"

import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Ship } from "lucide-react"

export function VesselSelector() {
  const { currentUser, vessels, selectedVessel, selectVessel, companies } = useApp()

  const companyName =
    currentUser?.companyId ? companies.find((c) => c.id === currentUser.companyId)?.name : null

  const companyVessels =
    currentUser?.role === "SUPER_ADMIN"
      ? vessels
      : currentUser?.companyId
          ? vessels.filter((v) => v.companyId === currentUser.companyId)
          : []

  function handleChange(vesselId: string) {
    const vessel = companyVessels.find((v) => v.id === vesselId)
    selectVessel(vessel || null)
  }

  function handleClear() {
    selectVessel(null)
  }

  if (companyVessels.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-card p-6 text-center">
        <Ship className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Nenhuma embarcacao encontrada</p>
          <p className="text-xs text-muted-foreground">
            {currentUser?.role === "SUPER_ADMIN"
              ? "Nenhuma embarcacao cadastrada."
              : `Nao ha embarcacoes cadastradas para a empresa ${companyName ?? "(sem empresa)"}.`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm font-medium">
        <Ship className="h-4 w-4 text-primary" />
        Embarcacao
      </label>
      <div className="flex items-center gap-2">
        <Select
          value={selectedVessel?.id || ""}
          onValueChange={handleChange}
        >
          <SelectTrigger className="w-full select-none">
            <SelectValue placeholder="Selecione uma embarcacao" />
          </SelectTrigger>
          <SelectContent>
            {companyVessels.map((vessel) => (
              <SelectItem key={vessel.id} value={vessel.id}>
                {vessel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedVessel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="shrink-0 select-none text-xs text-muted-foreground"
          >
            Limpar
          </Button>
        )}
      </div>
    </div>
  )
}
