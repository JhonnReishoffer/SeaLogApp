import type { SyncRequestEnvelope, SyncResponseEnvelope } from "@/lib/server/contracts/integration-envelope"
import type {
  DocumentRepository,
  SqlRepository,
  SyncPersistenceResult,
} from "@/lib/server/repositories/contracts"

/**
 * Servico de aplicacao para sincronizacao SQL + NoSQL.
 *
 * Responsabilidades:
 * - Orquestrar persistencia em ambos os bancos
 * - Centralizar regras transversais de sync
 * - Padronizar resposta para camada HTTP
 */
export class SyncService {
  constructor(
    private readonly sqlRepository: SqlRepository,
    private readonly documentRepository: DocumentRepository,
  ) {}

  async synchronize(envelope: SyncRequestEnvelope): Promise<SyncResponseEnvelope> {
    const result: SyncPersistenceResult = {
      sqlAccepted: 0,
      documentAccepted: 0,
      warnings: [],
    }

    /**
     * TODO (fase de implementacao real):
     * - Definir estrategia transacional (2PC/outbox/saga)
     * - Garantir idempotencia por traceId + hash do payload
     * - Registrar telemetria de latencia por modulo
     */

    result.sqlAccepted += await this.sqlRepository.upsertCompanies(envelope.sql.companies)
    result.sqlAccepted += await this.sqlRepository.upsertUsers(envelope.sql.users)
    result.sqlAccepted += await this.sqlRepository.upsertVessels(envelope.sql.vessels)

    result.documentAccepted += await this.documentRepository.upsertTemplates(
      envelope.documents.templates,
    )
    result.documentAccepted += await this.documentRepository.upsertEntries(envelope.documents.entries)

    const status = result.warnings.length > 0 ? "partial" : "accepted"

    return {
      traceId: envelope.traceId,
      receivedAt: new Date().toISOString(),
      status,
      acknowledgements: [
        {
          module: "sql",
          accepted: result.sqlAccepted,
          rejected: 0,
          warnings: result.warnings.length ? result.warnings : undefined,
        },
        {
          module: "documents",
          accepted: result.documentAccepted,
          rejected: 0,
          warnings: result.warnings.length ? result.warnings : undefined,
        },
      ],
    }
  }
}
