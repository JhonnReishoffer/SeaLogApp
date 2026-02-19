import type { CompanyId, UserId, VesselId } from "@/lib/server/contracts/identifiers"

/**
 * Contratos SQL (PostgreSQL) para entidades core do dominio.
 *
 * Entidades que ficam em relacional:
 * - Empresa
 * - Usuario
 * - Embarcacao
 */

export interface SqlAuditFields {
  createdAt: string
  updatedAt: string
}

export interface CompanySqlDTO extends SqlAuditFields {
  id: CompanyId
  name: string
  legalName?: string
  taxId?: string
  isActive: boolean
}

export interface UserSqlDTO extends SqlAuditFields {
  id: UserId
  companyId: CompanyId | null
  fullName: string
  email: string
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "NUTRI_ADMIN" | "USER"
  isActive: boolean
}

export interface VesselSqlDTO extends SqlAuditFields {
  id: VesselId
  companyId: CompanyId
  name: string
  registrationCode?: string
  isActive: boolean
}

/**
 * Payload de sincronizacao para upsert em SQL.
 *
 * Este formato foi desenhado para facilitar:
 * - Cargas em lote
 * - Mensageria/eventos
 * - Reprocessamento idempotente
 */
export interface SqlUpsertBatchDTO {
  traceId: string
  source: "web" | "mobile" | "integration"
  companies: CompanySqlDTO[]
  users: UserSqlDTO[]
  vessels: VesselSqlDTO[]
}
