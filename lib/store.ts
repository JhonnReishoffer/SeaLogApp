import type { User, Vessel, FormTemplate, FormEntry } from "./types"
import { DEFAULT_VESSELS, DEFAULT_TEMPLATES } from "./seed-data"

// ==========================================
// localStorage Keys
// ==========================================

const KEYS = {
  USERS: "sealog_users",
  CURRENT_USER: "sealog_current_user",
  VESSELS: "sealog_vessels",
  TEMPLATES: "sealog_templates",
  ENTRIES: "sealog_entries",
  SELECTED_VESSEL: "sealog_selected_vessel",
  INITIALIZED: "sealog_initialized",
} as const

// ==========================================
// Initialization
// ==========================================

function isClient() {
  return typeof window !== "undefined"
}

export function initializeStore() {
  if (!isClient()) return

  const initialized = localStorage.getItem(KEYS.INITIALIZED)
  if (initialized) return

  // Seed default data
  localStorage.setItem(KEYS.VESSELS, JSON.stringify(DEFAULT_VESSELS))
  localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES))
  localStorage.setItem(KEYS.ENTRIES, JSON.stringify([]))
  localStorage.setItem(KEYS.USERS, JSON.stringify([]))
  localStorage.setItem(KEYS.INITIALIZED, "true")
}

// ==========================================
// Generic CRUD Helpers
// ==========================================

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
  const users = getUsers().filter((u) => u.id !== userId)
  setItems(KEYS.USERS, users)
}

export function getCurrentUser(): User | null {
  if (!isClient()) return null
  const data = localStorage.getItem(KEYS.CURRENT_USER)
  return data ? JSON.parse(data) : null
}

export function setCurrentUser(user: User | null) {
  if (!isClient()) return
  if (user) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user))
  } else {
    localStorage.removeItem(KEYS.CURRENT_USER)
  }
}

// ==========================================
// Vessels
// ==========================================

export function getVessels(): Vessel[] {
  return getItems<Vessel>(KEYS.VESSELS)
}

export function getVesselsByCompany(company: string): Vessel[] {
  return getVessels().filter(
    (v) => v.company.toUpperCase() === company.toUpperCase()
  )
}

export function addVessel(vessel: Vessel) {
  const vessels = getVessels()
  vessels.push(vessel)
  setItems(KEYS.VESSELS, vessels)
}

export function getSelectedVessel(): Vessel | null {
  if (!isClient()) return null
  const data = localStorage.getItem(KEYS.SELECTED_VESSEL)
  return data ? JSON.parse(data) : null
}

export function setSelectedVessel(vessel: Vessel | null) {
  if (!isClient()) return
  if (vessel) {
    localStorage.setItem(KEYS.SELECTED_VESSEL, JSON.stringify(vessel))
  } else {
    localStorage.removeItem(KEYS.SELECTED_VESSEL)
  }
}

// ==========================================
// Form Templates
// ==========================================

export function getTemplates(): FormTemplate[] {
  return getItems<FormTemplate>(KEYS.TEMPLATES)
}

export function getTemplateById(id: string): FormTemplate | undefined {
  return getTemplates().find((t) => t.id === id)
}

// ==========================================
// Form Entries
// ==========================================

export function getEntries(): FormEntry[] {
  return getItems<FormEntry>(KEYS.ENTRIES)
}

export function getEntriesByVessel(vesselId: string): FormEntry[] {
  return getEntries().filter((e) => e.vesselId === vesselId)
}

export function getEntriesByCompany(company: string): FormEntry[] {
  return getEntries().filter(
    (e) => e.company.toUpperCase() === company.toUpperCase()
  )
}

export function getEntryById(id: string): FormEntry | undefined {
  return getEntries().find((e) => e.id === id)
}

export function createEntry(entry: FormEntry): FormEntry {
  const entries = getEntries()
  entries.push(entry)
  setItems(KEYS.ENTRIES, entries)
  return entry
}

export function updateEntry(entry: FormEntry): FormEntry {
  const entries = getEntries()
  const index = entries.findIndex((e) => e.id === entry.id)
  if (index !== -1) {
    entries[index] = entry
    setItems(KEYS.ENTRIES, entries)
  }
  return entry
}

export function deleteEntry(entryId: string) {
  const entries = getEntries().filter((e) => e.id !== entryId)
  setItems(KEYS.ENTRIES, entries)
}

// ==========================================
// Utility: Clear all data
// ==========================================

export function clearAllData() {
  if (!isClient()) return
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key))
}

// ==========================================
// Utility: Generate unique ID
// ==========================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
