import type { FormField } from "@/lib/types"

export function isEmptyValue(value: string | number | boolean | undefined) {
  if (typeof value === "boolean") return !value
  if (typeof value === "number") return Number.isNaN(value)
  return String(value ?? "").trim() === ""
}

function parseTime(value: string) {
  const [h, m] = value.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function validateFieldValue(field: FormField, rowValues: Record<string, string | number | boolean>) {
  const value = rowValues[field.id]

  if (field.required && isEmptyValue(value)) {
    return `${field.label} e obrigatorio.`
  }

  if ((field.type === "number" || field.type === "temperature") && typeof value === "number" && !Number.isNaN(value)) {
    if (typeof field.min === "number" && value < field.min) {
      return `${field.label} deve ser >= ${field.min}.`
    }
    if (typeof field.max === "number" && value > field.max) {
      return `${field.label} deve ser <= ${field.max}.`
    }
  }

  if (field.type === "time" && typeof value === "string" && value.trim() !== "" && field.maxTimeFromFieldId) {
    const ref = rowValues[field.maxTimeFromFieldId]
    if (typeof ref === "string" && ref.trim() !== "") {
      const current = parseTime(value)
      const refMinutes = parseTime(ref)
      if (current !== null && refMinutes !== null) {
        const allowed = refMinutes + (field.maxTimeOffsetMinutes ?? 0)
        if (current > allowed) {
          return `${field.label} deve ser ate ${field.maxTimeOffsetMinutes ?? 0} min apos ${field.maxTimeFromFieldId}.`
        }
      }
    }
  }

  return null
}
