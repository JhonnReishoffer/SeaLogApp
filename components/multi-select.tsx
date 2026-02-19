"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"

export type MultiSelectOption = { value: string; label: string }

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Selecionar...",
  className,
}: {
  options: MultiSelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  className?: string
}) {
  const selectedLabels = React.useMemo(() => {
    const byVal = new Map(options.map((o) => [o.value, o.label]))
    return value.map((v) => byVal.get(v) ?? v).filter(Boolean)
  }, [options, value])

  function toggle(val: string) {
    if (value.includes(val)) onChange(value.filter((v) => v !== val))
    else onChange([...value, val])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate text-left">
            {selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar..." />
          <CommandEmpty>Nenhuma opcao encontrada.</CommandEmpty>
          <CommandGroup>
            {options.map((opt) => {
              const checked = value.includes(opt.value)
              return (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => toggle(opt.value)}
                  className="cursor-pointer"
                >
                  <Check className={cn("mr-2 h-4 w-4", checked ? "opacity-100" : "opacity-0")} />
                  {opt.label}
                </CommandItem>
              )
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
