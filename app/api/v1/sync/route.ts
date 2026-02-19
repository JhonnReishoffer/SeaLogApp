import { NextResponse } from "next/server"

import { SyncSerializer } from "@/lib/server/serializers/sync-serializer"
import {
  InMemoryDocumentRepository,
  InMemorySqlRepository,
} from "@/lib/server/repositories/in-memory-adapters"
import { SyncService } from "@/lib/server/services/sync-service"

/**
 * Endpoint de sincronizacao de backend (estrutura inicial).
 *
 * POST /api/v1/sync
 * - Recebe envelope contendo payload SQL + NoSQL
 * - Processa via service
 * - Devolve ack padronizado
 */
export async function POST(request: Request) {
  const rawPayload = await request.json()
  const envelope = SyncSerializer.fromJson(rawPayload)

  // TODO: substituir adaptadores em memoria por implementacoes reais.
  const service = new SyncService(new InMemorySqlRepository(), new InMemoryDocumentRepository())
  const result = await service.synchronize(envelope)

  return NextResponse.json(SyncSerializer.toJson(result), { status: 202 })
}

/**
 * GET utilitario para documentar o formato esperado do contrato.
 *
 * Pode ser utilizado para testes manuais rapidos no inicio da implementacao.
 */
export async function GET() {
  return NextResponse.json(
    {
      message:
        "Estrutura de sincronizacao inicial ativa. Utilize POST com envelope SQL + documents.",
      path: "/api/v1/sync",
      notes: [
        "Implementar validacao robusta por schema antes de usar em producao.",
        "Substituir repositores in-memory por adapters reais de PostgreSQL/MongoDB.",
      ],
    },
    { status: 200 },
  )
}
