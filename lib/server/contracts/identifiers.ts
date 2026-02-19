/**
 * IDs tipados do backend.
 *
 * Objetivo:
 * - Evitar mistura acidental de IDs entre entidades diferentes.
 * - Padronizar contratos JSON para SQL (PostgreSQL) e NoSQL (MongoDB).
 *
 * Observacao:
 * - Em runtime todos os IDs continuam sendo string.
 * - O "brand" existe apenas para ajudar o TypeScript durante o desenvolvimento.
 */

type BrandedId<T extends string> = string & { readonly __entity: T }

export type CompanyId = BrandedId<"Company">
export type UserId = BrandedId<"User">
export type VesselId = BrandedId<"Vessel">
export type TemplateId = BrandedId<"FormTemplate">
export type FormEntryId = BrandedId<"FormEntry">

/**
 * ID generico de documento MongoDB.
 *
 * Pode representar:
 * - ObjectId serializado
 * - UUID
 * - Qualquer estrategia de chave definida no banco documental
 */
export type DocumentId = string & { readonly __document: "MongoDocument" }

/**
 * Utilitario para converter string em IDs tipados.
 *
 * IMPORTANTE:
 * - Isso nao valida formato real de UUID/ObjectId.
 * - A validacao de formato deve ficar em camada de validacao (ex: Zod, Joi, class-validator).
 */
export function asId<T extends string>(raw: string): BrandedId<T> {
  return raw as BrandedId<T>
}
