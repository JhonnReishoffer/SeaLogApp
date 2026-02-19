import type {
  SyncRequestEnvelope,
  SyncResponseEnvelope,
} from "@/lib/server/contracts/integration-envelope"

/**
 * Serializer central para sincronizacao.
 *
 * Neste momento a implementacao e intencionalmente simples e comentada,
 * para servir como base para futura camada de infraestrutura.
 */
export class SyncSerializer {
  /**
   * Normaliza o payload recebido.
   *
   * Pontos de evolucao sugeridos:
   * 1) Validacao estrutural com Zod
   * 2) Sanitizacao de campos de texto
   * 3) Conversao de datas para formato padrao ISO
   */
  static fromJson(payload: unknown): SyncRequestEnvelope {
    // TODO: substituir cast por validacao robusta com schema de runtime.
    return payload as SyncRequestEnvelope
  }

  /**
   * Formata resposta padrao de API para clientes internos/externos.
   */
  static toJson(response: SyncResponseEnvelope): SyncResponseEnvelope {
    // Neste caso, retornamos o objeto diretamente.
    // Em cenarios futuros, poderia haver transformacao de nomes de campo
    // (snake_case <-> camelCase), mascaramento de dados, etc.
    return response
  }
}
