// ==========================================
// SeaLogApp - Core Type Definitions (MVP Front)
// ==========================================

export type UserRole = "SUPER_ADMIN" | "COMPANY_ADMIN" | "USER"

export interface Company {
  id: string
  name: string
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  companyId: string | null
  role: UserRole
  avatarUrl?: string
  createdAt: string
}

export type FormEntryStatus =
  | "rascunho"
  | "em_revisao"
  | "revisada"
  | "aprovada"
  | "sincronizada"

export interface Vessel {
  id: string
  name: string
  companyId: string
}

export type FieldType =
  | "temperature"
  | "time"
  | "text"
  | "number"
  | "select"
  | "textarea"
  | "date"
  | "checkbox"

export type RuleSeverity = "OK" | "ALERTA" | "CRITICO"

export type ConditionOperator =
  | "equals"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "in"

export interface RuleCondition {
  fieldId: string
  op: ConditionOperator
  value: string | string[]
}

export interface ConditionGroup {
  all?: RuleCondition[]
  any?: RuleCondition[]
}

export type NumericOperator = "lt" | "lte" | "gt" | "gte" | "between" | "outside"

export interface NumericCheck {
  type: "number"
  op: NumericOperator
  a: number
  b?: number
}

export interface TextCheck {
  type: "text"
  op: ConditionOperator
  value: string | string[]
}

export interface FieldRule {
  id: string
  severity: Exclude<RuleSeverity, "OK">
  message: string
  when?: ConditionGroup
  check: NumericCheck | TextCheck
  requiresCorrectiveAction?: boolean
}

export interface FormField {
  id: string
  label: string
  type: FieldType
  required: boolean
  placeholder?: string
  min?: number
  max?: number
  /** For time fields: reference another time field from same row. */
  maxTimeFromFieldId?: string
  /** Allowed minutes after the reference field value (default: 0). */
  maxTimeOffsetMinutes?: number
  options?: string[]
  unit?: string
  width?: "full" | "half" | "third"
  rules?: FieldRule[]
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
}

export interface ColumnGroup {
  title: string
  fieldIds: string[]
}

export interface FormTemplate {
  id: string
  name: string
  shortName: string
  type: string
  version: string
  description: string
  sections: FormSection[]
  supportsMultipleRows: boolean
  createdAt: string
  columnGroups?: ColumnGroup[]
  /** Which companies can use this template. If empty/undefined, available to all (MVP). */
  companyIds?: string[]
  /** Export customization (MVP - global per template). */
  exportConfig?: {
    /** Explicit allowlist of fieldIds. If undefined/empty => export all fields. */
    includedFieldIds?: string[]
    /** Field order used in export (and optionally display), by fieldId. */
    fieldOrder?: string[]
  }
}

export interface CompanyTemplateConfig {
  id: string
  companyId: string
  templateId: string
  isEnabled: boolean
  hiddenFieldIds?: string[]
  renamedLabels?: Record<string, string>
  fieldOrder?: string[]
  ruleOverrides?: Record<string, FieldRule[]>
  updatedAt: string
}

export interface FormRowData {
  id: string
  date: string
  time: string
  shift: "Manha" | "Tarde" | "Noite"
  values: Record<string, string | number | boolean>
  correctiveAction?: string
}

export interface ReviewHistoryEntry {
  action: "enviado" | "revisada" | "aprovada" | "correcao"
  by: string
  byName: string
  date: string
  note?: string
}

export interface FormEntry {
  id: string
  templateId: string
  vesselId: string
  vesselName: string
  userId: string
  userName: string
  companyId: string
  period: string
  rows: FormRowData[]
  status: FormEntryStatus
  reviewHistory: ReviewHistoryEntry[]
  createdAt: string
  updatedAt: string
}

export interface AppState {
  currentUser: User | null
  selectedVessel: Vessel | null
  vessels: Vessel[]
  templates: FormTemplate[]
  entries: FormEntry[]
}

export const STATUS_CONFIG: Record<
  FormEntryStatus,
  { label: string; color: string; bgClass: string; textClass: string }
> = {
  rascunho: {
    label: "Rascunho",
    color: "gray",
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
  },
  em_revisao: {
    label: "Em Revisao",
    color: "yellow",
    bgClass: "bg-yellow-500/20",
    textClass: "text-yellow-500",
  },
  revisada: {
    label: "Revisada",
    color: "blue",
    bgClass: "bg-blue-500/20",
    textClass: "text-blue-500",
  },
  aprovada: {
    label: "Aprovada",
    color: "green",
    bgClass: "bg-green-500/20",
    textClass: "text-green-500",
  },
  sincronizada: {
    label: "Sincronizada",
    color: "green",
    bgClass: "bg-green-500/20",
    textClass: "text-green-400",
  },
}
