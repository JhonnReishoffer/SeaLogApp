import type {
  CompanyId,
  DocumentId,
  FormEntryId,
  TemplateId,
  UserId,
  VesselId,
} from "@/lib/server/contracts/identifiers"

/**
 * Contratos de documentos (MongoDB).
 *
 * Entidades customizaveis e semi-estruturadas ficam no banco documental:
 * - Definicoes de planilhas/formularios
 * - Entradas preenchidas
 * - Metadados extras opcionais
 */

export interface DocumentAuditFields {
  createdAt: string
  updatedAt: string
  schemaVersion: number
}

export interface FormFieldDocument {
  id: string
  label: string
  type: string
  required: boolean
  options?: string[]
  metadata?: Record<string, unknown>
}

export interface FormSectionDocument {
  id: string
  title: string
  description?: string
  fields: FormFieldDocument[]
}

export interface FormTemplateDocumentDTO extends DocumentAuditFields {
  _id: DocumentId
  templateId: TemplateId
  companyId?: CompanyId
  name: string
  shortName: string
  type: string
  version: string
  description?: string
  sections: FormSectionDocument[]
  flags?: {
    supportsMultipleRows?: boolean
    isArchived?: boolean
  }
}

export interface FormEntryDocumentDTO extends DocumentAuditFields {
  _id: DocumentId
  entryId: FormEntryId
  templateId: TemplateId
  companyId: CompanyId
  vesselId: VesselId
  userId: UserId
  status: "rascunho" | "em_revisao" | "revisada" | "aprovada" | "sincronizada"
  period: string
  rows: Array<{
    id: string
    date: string
    time: string
    shift: "Manha" | "Tarde" | "Noite"
    values: Record<string, string | number | boolean | null>
    correctiveAction?: string
  }>
  metadata?: Record<string, unknown>
}

export interface DocumentUpsertBatchDTO {
  traceId: string
  source: "web" | "mobile" | "integration"
  templates: FormTemplateDocumentDTO[]
  entries: FormEntryDocumentDTO[]
}
