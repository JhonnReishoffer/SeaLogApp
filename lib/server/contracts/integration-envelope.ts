import type { DocumentUpsertBatchDTO } from "@/lib/server/contracts/document-contracts"
import type { SqlUpsertBatchDTO } from "@/lib/server/contracts/sql-contracts"

/**
 * Envelope padrao para entrada/saida de API backend.
 *
 * Este contrato permite trafegar SQL + NoSQL juntos,
 * mantendo rastreabilidade via traceId e granularidade por modulo.
 */

export interface SyncRequestEnvelope {
  traceId: string
  sentAt: string
  sql: SqlUpsertBatchDTO
  documents: DocumentUpsertBatchDTO
}

export interface SyncAck {
  module: "sql" | "documents"
  accepted: number
  rejected: number
  warnings?: string[]
}

export interface SyncResponseEnvelope {
  traceId: string
  receivedAt: string
  status: "accepted" | "partial" | "rejected"
  acknowledgements: SyncAck[]
}
