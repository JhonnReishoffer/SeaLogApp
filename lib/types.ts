// ==========================================
// SeaLogApp - Core Type Definitions
// ==========================================

export type UserRole = "admin" | "supervisor" | "operador"

export interface User {
  id: string
  name: string
  email: string
  password: string
  company: string
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
  company: string
}

// ==========================================
// Form Template Definitions
// ==========================================

export type FieldType =
  | "temperature"
  | "time"
  | "text"
  | "number"
  | "select"
  | "textarea"
  | "date"
  | "checkbox"

export interface FormField {
  id: string
  label: string
  type: FieldType
  required: boolean
  placeholder?: string
  min?: number
  max?: number
  options?: string[]
  unit?: string
  width?: "full" | "half" | "third"
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
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
}

// ==========================================
// Form Entry (Filled Form)
// ==========================================

export interface FormRowData {
  id: string
  day: number
  values: Record<string, string | number | boolean>
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
  company: string
  period: string // "YYYY-MM" format
  rows: FormRowData[]
  status: FormEntryStatus
  reviewHistory: ReviewHistoryEntry[]
  createdAt: string
  updatedAt: string
}

// ==========================================
// App State
// ==========================================

export interface AppState {
  currentUser: User | null
  selectedVessel: Vessel | null
  vessels: Vessel[]
  templates: FormTemplate[]
  entries: FormEntry[]
}

// ==========================================
// Status labels and colors (pt-BR)
// ==========================================

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
