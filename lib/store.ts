import type {
  User,
  Vessel,
  FormTemplate,
  FormEntry,
  Company,
  CompanyTemplateConfig,
  FieldRule,
} from "./types"

import { DEFAULT_COMPANIES, DEFAULT_VESSELS, DEFAULT_TEMPLATES } from "./seed-data"

const KEYS = {
  USERS: "sealog_users",
  CURRENT_USER: "sealog_current_user",
  COMPANIES: "sealog_companies",
  VESSELS: "sealog_vessels",
  GLOBAL_TEMPLATES: "sealog_templates_global",
  COMPANY_TEMPLATE_CONFIGS: "sealog_company_template_configs",
  ENTRIES: "sealog_entries",
  SELECTED_VESSEL: "sealog_selected_vessel",
  INITIALIZED: "sealog_initialized",
} as const

function isClient() {
  return typeof window !== "undefined"
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function getItems<T>(key: string): T[] {
  if (!isClient()) return []
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

function setItems<T>(key: string, items: T[]) {
  if (!isClient()) return
  localStorage.setItem(key, JSON.stringify(items))
}

// ==========================================
// Initialization
// ==========================================

export function initializeStore() {
  if (!isClient()) return

  // First-time init
  if (!localStorage.getItem(KEYS.INITIALIZED)) {
    localStorage.setItem(KEYS.COMPANIES, JSON.stringify(DEFAULT_COMPANIES))
    localStorage.setItem(KEYS.VESSELS, JSON.stringify(DEFAULT_VESSELS))
    localStorage.setItem(KEYS.GLOBAL_TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES))
    localStorage.setItem(KEYS.COMPANY_TEMPLATE_CONFIGS, JSON.stringify([]))
    localStorage.setItem(KEYS.ENTRIES, JSON.stringify([]))
    localStorage.setItem(KEYS.USERS, JSON.stringify([]))
    localStorage.setItem(KEYS.INITIALIZED, "true")
    return
  }

  // Lightweight migration for MVP changes
  try {
    const companies = getItems<Company>(KEYS.COMPANIES)
    const hasNewDefaults = companies.some((c) => c.id === "c-seanutri")
    if (!hasNewDefaults) {
      // If an older demo dataset exists, reset the demo domain data (keep user accounts).
      localStorage.setItem(KEYS.COMPANIES, JSON.stringify(DEFAULT_COMPANIES))
      localStorage.setItem(KEYS.VESSELS, JSON.stringify(DEFAULT_VESSELS))
      localStorage.setItem(KEYS.GLOBAL_TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES))
      localStorage.setItem(KEYS.COMPANY_TEMPLATE_CONFIGS, JSON.stringify([]))
      localStorage.setItem(KEYS.ENTRIES, JSON.stringify([]))
    }

    // Ensure templates have companyIds and exportConfig fields (older data may not)
    const tpls = getItems<FormTemplate>(KEYS.GLOBAL_TEMPLATES)
    const allCompanyIds = (getItems<Company>(KEYS.COMPANIES) || []).map((c) => c.id)
    const migrated = tpls.map((t) => {
      const companyIds = (t as any).companyIds
      return {
        ...t,
        companyIds: Array.isArray(companyIds) ? companyIds : allCompanyIds,
        exportConfig: (t as any).exportConfig ?? undefined,
      } as FormTemplate
    })
    localStorage.setItem(KEYS.GLOBAL_TEMPLATES, JSON.stringify(migrated))
  } catch {
    // ignore
  }
}

// ==========================================
// Utilities
// ==========================================

/**
 * Clears all application data from localStorage (MVP reset).
 * After calling this, you should redirect the user to /login.
 */
export function clearAllData() {
  if (!isClient()) return
  Object.values(KEYS).forEach((k) => {
    try {
      localStorage.removeItem(k)
    } catch {
      // ignore
    }
  })
}

// ==========================================
// Companies
// ==========================================

export function getCompanies(): Company[] {
  return getItems<Company>(KEYS.COMPANIES)
}

export function getCompanyById(id: string): Company | undefined {
  return getCompanies().find((c) => c.id === id)
}

export function createCompany(company: Company): Company {
  const companies = getCompanies()
  companies.push(company)
  setItems(KEYS.COMPANIES, companies)
  return company
}

export function updateCompany(company: Company): Company {
  const companies = getCompanies()
  const idx = companies.findIndex((c) => c.id === company.id)
  if (idx !== -1) {
    companies[idx] = company
    setItems(KEYS.COMPANIES, companies)
  }
  return company
}


export function deleteCompany(companyId: string) {
  // delete company
  setItems(KEYS.COMPANIES, getCompanies().filter((c) => c.id !== companyId))

  // delete vessels for this company
  const vesselIds = getVessels().filter((v) => v.companyId === companyId).map((v) => v.id)
  setItems(KEYS.VESSELS, getVessels().filter((v) => v.companyId !== companyId))

  // unassign users that belonged to this company (keep accounts)
  setItems(
    KEYS.USERS,
    getUsers().map((u) => (u.companyId === companyId ? { ...u, companyId: null, role: u.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER" } : u))
  )

  // delete configs and entries for this company / its vessels
  setItems(KEYS.COMPANY_TEMPLATE_CONFIGS, getCompanyTemplateConfigs().filter((c) => c.companyId !== companyId))
  setItems(
    KEYS.ENTRIES,
    getEntries().filter((e) => e.companyId !== companyId && !vesselIds.includes(e.vesselId))
  )

  // if selected vessel was from deleted company, clear selection
  const selected = getSelectedVessel()
  if (selected && selected.companyId === companyId) {
    setSelectedVessel(null)
  }
}


// ==========================================
// Users
// ==========================================

export function getUsers(): User[] {
  return getItems<User>(KEYS.USERS)
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function createUser(user: User): User {
  const users = getUsers()
  users.push(user)
  setItems(KEYS.USERS, users)
  return user
}

export function updateUser(user: User): User {
  const users = getUsers()
  const index = users.findIndex((u) => u.id === user.id)
  if (index !== -1) {
    users[index] = user
    setItems(KEYS.USERS, users)
  }
  return user
}

export function deleteUser(userId: string) {
  setItems(KEYS.USERS, getUsers().filter((u) => u.id !== userId))
}

export function getCurrentUser(): User | null {
  if (!isClient()) return null
  const data = localStorage.getItem(KEYS.CURRENT_USER)
  return data ? JSON.parse(data) : null
}

export function setCurrentUser(user: User | null) {
  if (!isClient()) return
  if (user) localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user))
  else localStorage.removeItem(KEYS.CURRENT_USER)
}

// ==========================================
// Vessels
// ==========================================

export function getVessels(): Vessel[] {
  return getItems<Vessel>(KEYS.VESSELS)
}

export function getVesselsByCompanyId(companyId: string): Vessel[] {
  return getVessels().filter((v) => v.companyId === companyId)
}

export function addVessel(vessel: Vessel) {
  const vessels = getVessels()
  vessels.push(vessel)
  setItems(KEYS.VESSELS, vessels)
}

export function setSelectedVessel(vessel: Vessel | null) {
  if (!isClient()) return
  if (vessel) localStorage.setItem(KEYS.SELECTED_VESSEL, JSON.stringify(vessel))
  else localStorage.removeItem(KEYS.SELECTED_VESSEL)
}

export function getSelectedVessel(): Vessel | null {
  if (!isClient()) return null
  const data = localStorage.getItem(KEYS.SELECTED_VESSEL)
  return data ? JSON.parse(data) : null
}

// ==========================================
// Global Templates
// ==========================================

export function getGlobalTemplates(): FormTemplate[] {
  return getItems<FormTemplate>(KEYS.GLOBAL_TEMPLATES)
}


// CRUD for global templates (SUPER_ADMIN)
export function createGlobalTemplate(template: FormTemplate): FormTemplate {
  const all = getGlobalTemplates()
  all.push(template)
  setItems(KEYS.GLOBAL_TEMPLATES, all)
  return template
}

export function updateGlobalTemplate(template: FormTemplate): FormTemplate {
  const all = getGlobalTemplates()
  const idx = all.findIndex((t) => t.id === template.id)
  if (idx !== -1) {
    all[idx] = template
    setItems(KEYS.GLOBAL_TEMPLATES, all)
  }
  return template
}

export function deleteGlobalTemplate(templateId: string) {
  setItems(
    KEYS.GLOBAL_TEMPLATES,
    getGlobalTemplates().filter((t) => t.id !== templateId)
  )
  // Remove any configs referencing this template
  setItems(
    KEYS.COMPANY_TEMPLATE_CONFIGS,
    getCompanyTemplateConfigs().filter((c) => c.templateId !== templateId)
  )
  // Remove entries for this template
  setItems(
    KEYS.ENTRIES,
    getEntries().filter((e) => e.templateId !== templateId)
  )
}

export function getCompanyTemplateConfigs(): CompanyTemplateConfig[] {
  return getItems<CompanyTemplateConfig>(KEYS.COMPANY_TEMPLATE_CONFIGS)
}

export function getCompanyTemplateConfig(companyId: string, templateId: string) {
  return getCompanyTemplateConfigs().find(
    (c) => c.companyId === companyId && c.templateId === templateId
  )
}

export function upsertCompanyTemplateConfig(cfg: CompanyTemplateConfig) {
  const all = getCompanyTemplateConfigs()
  const idx = all.findIndex((c) => c.id === cfg.id)
  if (idx !== -1) all[idx] = cfg
  else all.push(cfg)
  setItems(KEYS.COMPANY_TEMPLATE_CONFIGS, all)
}

export function setCompanyTemplateEnabled(companyId: string, templateId: string, isEnabled: boolean) {
  const existing = getCompanyTemplateConfig(companyId, templateId)
  const cfg: CompanyTemplateConfig = existing
    ? { ...existing, isEnabled, updatedAt: new Date().toISOString() }
    : {
        id: generateId(),
        companyId,
        templateId,
        isEnabled,
        updatedAt: new Date().toISOString(),
      }
  upsertCompanyTemplateConfig(cfg)
}

export function applyTemplateOverrides(template: FormTemplate, cfg?: CompanyTemplateConfig): FormTemplate {
  if (!cfg) return template
  const hidden = new Set(cfg.hiddenFieldIds ?? [])
  const renamed = cfg.renamedLabels ?? {}
  const ruleOverrides = cfg.ruleOverrides ?? {}
  const fieldOrder = cfg.fieldOrder ?? []
  const orderIndex = new Map(fieldOrder.map((id, idx) => [id, idx]))

  const sections = template.sections.map((sec) => {
    const fields = sec.fields
      .filter((f) => !hidden.has(f.id))
      .map((f) => {
        const overrideRules = ruleOverrides[f.id]
        const rules: FieldRule[] | undefined = overrideRules ?? f.rules
        return {
          ...f,
          label: renamed[f.id] ?? f.label,
          rules,
        }
      })
      .sort((a, b) => {
        const ai = orderIndex.has(a.id) ? (orderIndex.get(a.id) as number) : 9999
        const bi = orderIndex.has(b.id) ? (orderIndex.get(b.id) as number) : 9999
        if (ai !== bi) return ai - bi
        return a.label.localeCompare(b.label)
      })
    return { ...sec, fields }
  })

  const columnGroups = template.columnGroups
    ? template.columnGroups
        .map((g) => ({
          ...g,
          fieldIds: g.fieldIds.filter((id) => !hidden.has(id)),
        }))
        .filter((g) => g.fieldIds.length > 0)
    : undefined

  return { ...template, sections, columnGroups }
}

export function getEffectiveTemplatesForCompany(companyId: string): FormTemplate[] {
  const globals = getGlobalTemplates()

  // Optional per-company overrides (hide/rename/reorder/rules). Activation is primarily controlled by template.companyIds.
  const cfgs = getCompanyTemplateConfigs().filter((c) => c.companyId === companyId)
  const cfgByTpl = new Map(cfgs.map((c) => [c.templateId, c]))

  return globals
    .filter((t) => {
      const allowed = !t.companyIds || t.companyIds.length === 0 || t.companyIds.includes(companyId)
      const cfg = cfgByTpl.get(t.id)
      // If there is an explicit config, respect enable/disable; otherwise use allowed list.
      if (cfg) return cfg.isEnabled !== false && allowed
      return allowed
    })
    .map((t) => applyTemplateOverrides(t, cfgByTpl.get(t.id)))
}


// ==========================================
// Entries
// ==========================================

export function getEntries(): FormEntry[] {
  return getItems<FormEntry>(KEYS.ENTRIES)
}

export function createEntry(entry: FormEntry): FormEntry {
  const entries = getEntries()
  entries.push(entry)
  setItems(KEYS.ENTRIES, entries)
  return entry
}

export function updateEntry(entry: FormEntry): FormEntry {
  const entries = getEntries()
  const idx = entries.findIndex((e) => e.id === entry.id)
  if (idx !== -1) {
    entries[idx] = entry
    setItems(KEYS.ENTRIES, entries)
  }
  return entry
}

export function deleteEntry(entryId: string) {
  setItems(KEYS.ENTRIES, getEntries().filter((e) => e.id !== entryId))
}
