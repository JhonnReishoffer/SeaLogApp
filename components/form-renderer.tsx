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
}

export function FormFieldRenderer({
  field,
  value,
  rowValues,
  onChange,
  disabled = false,
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
            className="text-base"
            disabled={disabled}
          />
        )

      case "time":
        return (
          <Input
            type="time"
            value={stringVal}
            onChange={(e) => onChange(field.id, e.target.value)}
            className="text-base"
            disabled={disabled}
          />
        )

      case "date":
        return (
          <Input
            type="date"
            value={stringVal}
            onChange={(e) => onChange(field.id, e.target.value)}
            className="text-base"
            disabled={disabled}
          />
        )

      case "text":
        return (
          <Input
            type="text"
            value={stringVal}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="text-base"
            disabled={disabled}
          />
        )

      case "textarea":
        return (
          <Textarea
            value={stringVal}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={2}
            className="text-base"
            disabled={disabled}
          />
        )

      case "select":
        return (
          <Select
            value={stringVal}
            onValueChange={(v) => onChange(field.id, v)}
            disabled={disabled}
          >
            <SelectTrigger className="text-base select-none">
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
          <label className="flex items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(field.id, e.target.checked)}
              disabled={disabled}
              className="h-5 w-5 rounded border-input accent-primary"
            />
            <span className="text-sm">{field.placeholder || "Sim"}</span>
          </label>
        )

      default:
        return (
          <Input
            type="text"
            value={stringVal}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="text-base"
            disabled={disabled}
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
        />
      ))}
    </div>
  )
}
