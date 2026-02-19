import * as XLSX from "xlsx"
import type { FieldType, FormField, FormTemplate } from "@/lib/types"

const SUPPORTED_TYPES: FieldType[] = [
  "text",
  "textarea",
  "number",
  "temperature",
  "time",
  "date",
  "select",
  "checkbox",
]

const FIELD_TYPE_SET = new Set<FieldType>(SUPPORTED_TYPES)

export interface ParsedXlsxTemplate {
  template: Omit<FormTemplate, "id" | "createdAt">
  warnings: string[]
}

function cell(sheet: XLSX.WorkSheet, address: string): string {
  const value = sheet[address]?.v
  if (value === null || value === undefined) return ""
  return String(value).trim()
}

function parseBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return ["sim", "s", "yes", "y", "true", "1"].includes(normalized)
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export function parseTemplateXlsx(buffer: ArrayBuffer): ParsedXlsxTemplate {
  const workbook = XLSX.read(buffer, { type: "array" })
  const firstSheetName = workbook.SheetNames[0]

  if (!firstSheetName) {
    throw new Error("O arquivo XLSX nao possui abas.")
  }

  const sheet = workbook.Sheets[firstSheetName]

  const name = cell(sheet, "B2")
  const shortName = cell(sheet, "B3") || name
  const type = cell(sheet, "B4") || "custom"
  const version = cell(sheet, "B5") || "1.0"
  const description = cell(sheet, "B6")

  if (!name) {
    throw new Error("A celula B2 (Nome da planilha) e obrigatoria.")
  }

  const warnings: string[] = []
  const fields: FormField[] = []

  for (let row = 11; row <= 300; row++) {
    const label = cell(sheet, `A${row}`)
    const fieldTypeRaw = cell(sheet, `B${row}`).toLowerCase() as FieldType

    if (!label && !fieldTypeRaw) continue

    if (!label) {
      warnings.push(`Linha ${row}: campo ignorado porque a coluna A (label) esta vazia.`)
      continue
    }

    if (!FIELD_TYPE_SET.has(fieldTypeRaw)) {
      warnings.push(
        `Linha ${row}: tipo "${fieldTypeRaw || "(vazio)"}" invalido. Tipos aceitos: ${SUPPORTED_TYPES.join(", ")}.`
      )
      continue
    }

    const requiredRaw = cell(sheet, `C${row}`)
    const idRaw = cell(sheet, `D${row}`)
    const placeholder = cell(sheet, `E${row}`)
    const optionsRaw = cell(sheet, `F${row}`)
    const unit = cell(sheet, `G${row}`)
    const minRaw = cell(sheet, `H${row}`)
    const maxRaw = cell(sheet, `I${row}`)

    const min = minRaw ? Number(minRaw) : undefined
    const max = maxRaw ? Number(maxRaw) : undefined

    if (minRaw && Number.isNaN(min)) {
      warnings.push(`Linha ${row}: valor minimo "${minRaw}" invalido e foi ignorado.`)
    }

    if (maxRaw && Number.isNaN(max)) {
      warnings.push(`Linha ${row}: valor maximo "${maxRaw}" invalido e foi ignorado.`)
    }

    const field: FormField = {
      id: idRaw || slugify(label) || `campo_${row}`,
      label,
      type: fieldTypeRaw,
      required: parseBoolean(requiredRaw),
      placeholder: placeholder || undefined,
      options:
        fieldTypeRaw === "select"
          ? optionsRaw
              .split("|")
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
      unit: unit || (fieldTypeRaw === "temperature" ? "°C" : undefined),
      min: min !== undefined && !Number.isNaN(min) ? min : undefined,
      max: max !== undefined && !Number.isNaN(max) ? max : undefined,
      width: "half",
    }

    fields.push(field)
  }

  if (fields.length === 0) {
    throw new Error("Nenhum campo valido encontrado. Preencha a tabela a partir da linha 11.")
  }

  const normalizedLabels = fields.map((f) => f.label.trim().toLowerCase())
  const uniqueLabels = new Set(normalizedLabels)
  if (uniqueLabels.size !== normalizedLabels.length) {
    throw new Error("Nenhum campo pode ter nome igual. Ajuste os labels duplicados para concluir a importacao.")
  }

  return {
    template: {
      name,
      shortName,
      type,
      version,
      description,
      sections: [
        {
          id: "sec-1",
          title: "Campos",
          fields,
        },
      ],
      supportsMultipleRows: true,
      companyIds: [],
    },
    warnings,
  }
}
