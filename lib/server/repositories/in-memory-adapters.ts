import type {
  DocumentRepository,
  SqlRepository,
} from "@/lib/server/repositories/contracts"
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
 * Adapters temporarios em memoria.
 *
 * Eles existem apenas para permitir evolucao incremental da arquitetura.
 * Na implementacao oficial, esses adapters devem ser substituidos por
 * classes concretas conectadas ao PostgreSQL e MongoDB.
 */

export class InMemorySqlRepository implements SqlRepository {
  async upsertCompanies(companies: CompanySqlDTO[]): Promise<number> {
    return companies.length
  }

  async upsertUsers(users: UserSqlDTO[]): Promise<number> {
    return users.length
  }

  async upsertVessels(vessels: VesselSqlDTO[]): Promise<number> {
    return vessels.length
  }
}

export class InMemoryDocumentRepository implements DocumentRepository {
  async upsertTemplates(templates: FormTemplateDocumentDTO[]): Promise<number> {
    return templates.length
  }

  async upsertEntries(entries: FormEntryDocumentDTO[]): Promise<number> {
    return entries.length
  }
}
