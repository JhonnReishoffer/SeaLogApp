# Estrutura proposta para backend híbrido (PostgreSQL + MongoDB)

> Documento de apoio para iniciar o backend separado com contratos já definidos no front.

## 1) Separação de responsabilidades

- **SQL (PostgreSQL)**: empresas, usuários e embarcações.
- **NoSQL (MongoDB)**: planilhas/formulários, entradas de formulário e metadados flexíveis.

## 2) Contratos criados

- `lib/server/contracts/identifiers.ts`
  - IDs tipados por entidade para reduzir erros de integração.
- `lib/server/contracts/sql-contracts.ts`
  - DTOs relacionais e lote de upsert SQL.
- `lib/server/contracts/document-contracts.ts`
  - DTOs documentais e lote de upsert NoSQL.
- `lib/server/contracts/integration-envelope.ts`
  - Envelope único para envio/retorno da sincronização.

## 3) Camadas server-side criadas

- **Serializer**: `lib/server/serializers/sync-serializer.ts`
  - Ponto central para normalização e serialização dos JSONs.
- **Repository contracts**: `lib/server/repositories/contracts.ts`
  - Interfaces para desacoplar serviço das tecnologias de banco.
- **Adapters temporários**: `lib/server/repositories/in-memory-adapters.ts`
  - Mock inicial para permitir testes de fluxo sem banco real.
- **Service**: `lib/server/services/sync-service.ts`
  - Orquestra persistência SQL + documentos.
- **HTTP endpoint**: `app/api/v1/sync/route.ts`
  - Exposição da estrutura via API Next.js.

## 4) Próximos passos sugeridos

1. Implementar validação com Zod/Joi nos envelopes.
2. Substituir adapters em memória por:
   - repositório PostgreSQL (Prisma/Drizzle/Knex)
   - repositório MongoDB (Mongoose/driver nativo)
3. Definir idempotência por `traceId`.
4. Definir estratégia transacional entre bancos (outbox/saga).
5. Criar testes de contrato e testes de integração da rota `/api/v1/sync`.
