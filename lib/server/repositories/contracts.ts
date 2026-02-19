import type {
  FormEntryDocumentDTO,
  FormTemplateDocumentDTO,
} from "@/lib/server/contracts/document-contracts"
import type {
  CompanySqlDTO,
  UserSqlDTO,
  VesselSqlDTO,
} from "@/lib/server/contracts/sql-contracts"

/**
 * Contratos de repositorio (ports/adapters).
 *
 * A ideia e manter o dominio desacoplado da tecnologia:
 * - PostgreSQL pode ser implementado com Prisma, Knex, Drizzle, TypeORM etc.
 * - MongoDB pode ser implementado com Mongoose, driver nativo, etc.
 */

export interface SqlRepository {
  upsertCompanies(companies: CompanySqlDTO[]): Promise<number>
  upsertUsers(users: UserSqlDTO[]): Promise<number>
  upsertVessels(vessels: VesselSqlDTO[]): Promise<number>
}

export interface DocumentRepository {
  upsertTemplates(templates: FormTemplateDocumentDTO[]): Promise<number>
  upsertEntries(entries: FormEntryDocumentDTO[]): Promise<number>
}

/**
 * Resultado de processamento para observabilidade.
 */
export interface SyncPersistenceResult {
  sqlAccepted: number
  documentAccepted: number
  warnings: string[]
}
