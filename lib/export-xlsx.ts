import type { FormEntry, FormTemplate } from "./types"

/**
 * Export entries to XLSX format using SheetJS (xlsx)
 * Generates a workbook with one sheet per form type
 */
export async function exportToXlsx(
  entries: FormEntry[],
  templates: FormTemplate[],
  vesselName: string,
  period: string
) {
  // Dynamic import of xlsx
  const XLSX = await import("xlsx")

  const wb = XLSX.utils.book_new()

  // Group entries by template
  const grouped = new Map<string, FormEntry[]>()
  for (const entry of entries) {
    const list = grouped.get(entry.templateId) || []
    list.push(entry)
    grouped.set(entry.templateId, list)
  }

  grouped.forEach((templateEntries, templateId) => {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return

    const allFields = template.sections.flatMap((s) => s.fields)
    const headers = [
      "Registro #",
      ...allFields.map((f) => f.label),
      "Status",
      "Responsavel",
      "Data Atualizacao",
    ]

    const rows: (string | number)[][] = []

    let rowIndex = 1
    for (const entry of templateEntries) {
      for (const row of entry.rows) {
        const rowData: (string | number)[] = [
          rowIndex,
          ...allFields.map((f) => {
            const val = row.values[f.id]
            if (val === undefined || val === null || val === "") return ""
            return val as string | number
          }),
          entry.status,
          entry.userName,
          new Date(entry.updatedAt).toLocaleDateString("pt-BR"),
        ]
        rows.push(rowData)
        rowIndex++
      }
    }

    const wsData = [headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Auto-width columns
    const colWidths = headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...rows.map((r) => String(r[i] || "").length)
      )
      return { wch: Math.min(maxLen + 2, 40) }
    })
    ws["!cols"] = colWidths

    const sheetName = template.shortName.substring(0, 31) // Excel limit
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  })

  // Generate filename
  const sanitizedVessel = vesselName.replace(/[^a-zA-Z0-9]/g, "_")
  const filename = `SeaLog_${sanitizedVessel}_${period}.xlsx`

  // Trigger download
  XLSX.writeFile(wb, filename)
}
