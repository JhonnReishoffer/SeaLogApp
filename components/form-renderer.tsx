"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { isEmptyValue, validateFieldValue } from "@/lib/form-validation"
import type { FormField, FormRowData } from "@/lib/types"

interface FormFieldRendererProps {
  field: FormField
  value: string | number | boolean
  rowValues: Record<string, string | number | boolean>
  onChange: (fieldId: string, value: string | number | boolean) => void
  disabled?: boolean
  dependencyLocked?: boolean
}

export function FormFieldRenderer({
  field,
  value,
  rowValues,
  onChange,
  disabled = false,
  dependencyLocked = false,
}: FormFieldRendererProps) {
  const widthClass =
    field.width === "full"
      ? "col-span-full"
      : field.width === "third"
        ? "col-span-1"
        : "col-span-full sm:col-span-1"

  const stringVal = value !== undefined && value !== null ? String(value) : ""
  const fieldError = validateFieldValue(field, rowValues)
  const showRequiredAsterisk = field.required && isEmptyValue(rowValues[field.id])
  const isDisabled = disabled || dependencyLocked
  const lockedClass = dependencyLocked ? "bg-muted/70 text-muted-foreground border-muted" : ""

  function renderField() {
    switch (field.type) {
      case "temperature":
      case "number":
        return (
          <Input
            type="number"
            value={stringVal}
            onChange={(e) => {
              const v = e.target.value
              onChange(field.id, v === "" ? "" : Number(v))
            }}
            min={field.min}
            max={field.max}
            placeholder={field.placeholder || (field.unit ? `${field.unit}` : "")}
            className={cn("text-base", lockedClass)}
            disabled={isDisabled}
          />
        )

      case "time":
        return (
          <Input
            type="time"
            value={stringVal}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={cn("text-base", lockedClass)}
            disabled={isDisabled}
          />
        )

      case "date":
        return (
          <Input
            type="date"
            value={stringVal}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={cn("text-base", lockedClass)}
            disabled={isDisabled}
          />
        )

      case "text":
        return (
          <Input
            type="text"
            value={stringVal}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={cn("text-base", lockedClass)}
            disabled={isDisabled}
          />
        )

      case "textarea":
        return (
          <Textarea
            value={stringVal}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={2}
            className={cn("text-base", lockedClass)}
            disabled={isDisabled}
          />
        )

      case "select":
        return (
          <Select
            value={stringVal}
            onValueChange={(v) => onChange(field.id, v)}
            disabled={isDisabled}
          >
            <SelectTrigger className={cn("text-base select-none", lockedClass)}>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "checkbox":
        return (
          <label className={cn("flex items-center gap-2 select-none rounded-md border px-3 py-2", dependencyLocked && "bg-muted/70 border-muted") }>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(field.id, e.target.checked)}
              disabled={isDisabled}
              className="h-5 w-5 rounded border-input accent-primary"
            />
            <span className={cn("text-sm", dependencyLocked && "text-muted-foreground")}>{field.placeholder || "Sim"}</span>
          </label>
        )

      default:
        return (
          <Input
            type="text"
            value={stringVal}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={cn("text-base", lockedClass)}
            disabled={isDisabled}
          />
        )
    }
  }

  return (
    <div className={cn("flex flex-col gap-1.5", widthClass)}>
      <Label className="text-sm font-medium">
        {field.label}
        {showRequiredAsterisk && <span className="ml-0.5 text-destructive-foreground">*</span>}
        {field.unit && (
          <span className="ml-1 text-xs text-muted-foreground">({field.unit})</span>
        )}
      </Label>
      {renderField()}
      {fieldError && <p className="text-xs text-destructive-foreground">{fieldError}</p>}
    </div>
  )
}

// ==========================================
// Row renderer - renders all fields for one row
// ==========================================

interface FormRowRendererProps {
  fields: FormField[]
  row: FormRowData
  onChange: (fieldId: string, value: string | number | boolean) => void
  disabled?: boolean
}

function isFieldDependencyLocked(
  field: FormField,
  rowValues: Record<string, string | number | boolean>
) {
  if (!field.dependsOnSelectFieldId || !field.dependsOnSelectValue) return false
  const selectedValue = rowValues[field.dependsOnSelectFieldId]
  return String(selectedValue ?? "").toLowerCase() === field.dependsOnSelectValue.toLowerCase()
}

export function FormRowRenderer({
  fields,
  row,
  onChange,
  disabled = false,
}: FormRowRendererProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        
        <FormFieldRenderer
          key={field.id}
          field={field}
          value={row.values[field.id] ?? ""}
          rowValues={row.values}
          onChange={onChange}
          disabled={disabled}
          dependencyLocked={isFieldDependencyLocked(field, row.values)}
        />
      ))}
    </div>
  )
}
