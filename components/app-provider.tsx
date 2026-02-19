"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react"
import type {
  User,
  Vessel,
  FormTemplate,
  FormEntry,
  Company,
  CompanyTemplateConfig,
} from "@/lib/types"
import * as store from "@/lib/store"

// ==========================================
// Context Types
// ==========================================

interface AppContextType {
  // Auth
  currentUser: User | null
  login: (email: string, password: string) => { success: boolean; error?: string }
  loginWithGoogle: (name: string, email: string) => void
  logout: () => void
  updateCurrentUser: (user: User) => void
  deleteAccount: () => void

  // Vessels
  vessels: Vessel[]
  selectedVessel: Vessel | null
  selectVessel: (vessel: Vessel | null) => void
  refreshVessels: () => void

  // Companies
  companies: Company[]
  companyTemplateConfigs: CompanyTemplateConfig[]
  refreshCompanies: () => void
  refreshCompanyTemplateConfigs: () => void

  // Templates
  templates: FormTemplate[]
  refreshTemplates: () => void

  // MVP demo helper
  setDemoRole: (role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "NUTRI_ADMIN" | "USER") => void
  setDemoCompany: (companyId: string) => void

  // Entries
  entries: FormEntry[]
  refreshEntries: () => void
  createEntry: (entry: FormEntry) => void
  updateEntry: (entry: FormEntry) => void
  deleteEntry: (entryId: string) => void

  // Users (admin)
  allUsers: User[]
  refreshUsers: () => void
}

const AppContext = createContext<AppContextType | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}

// ==========================================
// Provider
// ==========================================

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null)
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [entries, setEntries] = useState<FormEntry[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyTemplateConfigs, setCompanyTemplateConfigs] = useState<CompanyTemplateConfig[]>([])
  const [initialized, setInitialized] = useState(false)

  // Initialize store and load data
  useEffect(() => {
    store.initializeStore()
    const user = store.getCurrentUser()
    setCurrentUser(user)
    setCompanies(store.getCompanies())
    setCompanyTemplateConfigs(store.getCompanyTemplateConfigs())
    setVessels(store.getVessels())
    setSelectedVessel(store.getSelectedVessel())
    if (user?.role === "SUPER_ADMIN") {
      setTemplates(store.getGlobalTemplates())
    } else if (user?.companyId) {
      setTemplates(store.getEffectiveTemplatesForCompany(user.companyId))
    } else {
      setTemplates([])
    }
    setEntries(store.getEntries())
    setAllUsers(store.getUsers())
    setInitialized(true)
  }, [])

  // Auth functions
  const login = useCallback(
    (email: string, password: string): { success: boolean; error?: string } => {
      const existingUser = store.getUserByEmail(email)
      if (existingUser) {
        if (existingUser.password !== password) {
          return { success: false, error: "Senha incorreta" }
        }
        store.setCurrentUser(existingUser)
        setCurrentUser(existingUser)
        return { success: true }
      }
      // Create new user
      const newUser: User = {
        id: store.generateId(),
        name: email.split("@")[0],
        email,
        password,
        companyId: null,
        role: "USER",
        createdAt: new Date().toISOString(),
      }
      store.createUser(newUser)
      store.setCurrentUser(newUser)
      setCurrentUser(newUser)
      setAllUsers(store.getUsers())
      return { success: true }
    },
    []
  )

  const loginWithGoogle = useCallback((name: string, email: string) => {
    let existingUser = store.getUserByEmail(email)
    if (!existingUser) {
      existingUser = {
        id: store.generateId(),
        name,
        email,
        password: "",
        companyId: null,
        role: "USER",
        createdAt: new Date().toISOString(),
      }
      store.createUser(existingUser)
      setAllUsers(store.getUsers())
    }
    store.setCurrentUser(existingUser)
    setCurrentUser(existingUser)
    if (existingUser.role === "SUPER_ADMIN") {
      setTemplates(store.getGlobalTemplates())
    } else if (existingUser.companyId) {
      setTemplates(store.getEffectiveTemplatesForCompany(existingUser.companyId))
    } else {
      setTemplates([])
    }
  }, [])

  const logout = useCallback(() => {
    store.setCurrentUser(null)
    store.setSelectedVessel(null)
    setCurrentUser(null)
    setSelectedVessel(null)
  }, [])

  const updateCurrentUser = useCallback((user: User) => {
    store.updateUser(user)
    store.setCurrentUser(user)
    setCurrentUser(user)
    setAllUsers(store.getUsers())
    setCompanies(store.getCompanies())
    setCompanyTemplateConfigs(store.getCompanyTemplateConfigs())
    setVessels(store.getVessels())
    if (user.role === "SUPER_ADMIN") {
      setTemplates(store.getGlobalTemplates())
    } else if (user.companyId) {
      setTemplates(store.getEffectiveTemplatesForCompany(user.companyId))
    } else {
      setTemplates([])
    }
  }, [])

  const deleteAccount = useCallback(() => {
    if (currentUser) {
      store.deleteUser(currentUser.id)
      store.setCurrentUser(null)
      store.setSelectedVessel(null)
      setCurrentUser(null)
      setSelectedVessel(null)
      setAllUsers(store.getUsers())
    }
  }, [currentUser])

  // Vessel functions
  const selectVessel = useCallback((vessel: Vessel | null) => {
    store.setSelectedVessel(vessel)
    setSelectedVessel(vessel)
  }, [])

  const refreshVessels = useCallback(() => {
    setVessels(store.getVessels())
    const selected = store.getSelectedVessel()
    setSelectedVessel(selected)
  }, [])

  // Entry functions
  const refreshEntries = useCallback(() => {
    setEntries(store.getEntries())
  }, [])

  const refreshCompanies = useCallback(() => {
    setCompanies(store.getCompanies())
  }, [])

  const refreshTemplates = useCallback(() => {
    if (currentUser?.role === "SUPER_ADMIN") {
      setTemplates(store.getGlobalTemplates())
    } else if (currentUser?.companyId) {
      setTemplates(store.getEffectiveTemplatesForCompany(currentUser.companyId))
    } else {
      setTemplates([])
    }
  }, [currentUser])

  const setDemoRole = useCallback(
    (role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "NUTRI_ADMIN" | "USER") => {
      if (!currentUser) return
      const updated: User = { ...currentUser, role }
      store.updateUser(updated)
      store.setCurrentUser(updated)
      setCurrentUser(updated)
      // refresh dependent collections immediately
      if (role === "SUPER_ADMIN") {
        setVessels(store.getVessels())
        setTemplates(store.getGlobalTemplates())
      } else if (updated.companyId) {
        setVessels(store.getVesselsByCompanyId(updated.companyId))
        setTemplates(store.getEffectiveTemplatesForCompany(updated.companyId))
      } else {
        setTemplates([])
      }
    },
    [currentUser]
  )

  const setDemoCompany = useCallback((companyId: string) => {
    if (!currentUser) return
    const updated: User = { ...currentUser, companyId }
    store.updateUser(updated)
    store.setCurrentUser(updated)
    setCurrentUser(updated)
    setVessels(store.getVesselsByCompanyId(companyId))
    setTemplates(store.getEffectiveTemplatesForCompany(companyId))
    setSelectedVessel(null)
    store.setSelectedVessel(null)
  }, [currentUser])

  const refreshCompanyTemplateConfigs = useCallback(() => {
    setCompanyTemplateConfigs(store.getCompanyTemplateConfigs())
    refreshTemplates()
  }, [refreshTemplates])

  const handleCreateEntry = useCallback((entry: FormEntry) => {
    store.createEntry(entry)
    setEntries(store.getEntries())
  }, [])

  const handleUpdateEntry = useCallback((entry: FormEntry) => {
    store.updateEntry(entry)
    setEntries(store.getEntries())
  }, [])

  const handleDeleteEntry = useCallback((entryId: string) => {
    store.deleteEntry(entryId)
    setEntries(store.getEntries())
  }, [])

  // Users
  const refreshUsers = useCallback(() => {
    setAllUsers(store.getUsers())
  }, [])

  if (!initialized) {
    return null
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        loginWithGoogle,
        logout,
        updateCurrentUser,
        deleteAccount,
        vessels,
        selectedVessel,
        selectVessel,
        refreshVessels,
        companies,
        companyTemplateConfigs,
        refreshCompanies,
        refreshCompanyTemplateConfigs,
        templates,
        refreshTemplates,
        setDemoRole,
        setDemoCompany,
        entries,
        refreshEntries,
        createEntry: handleCreateEntry,
        updateEntry: handleUpdateEntry,
        deleteEntry: handleDeleteEntry,
        allUsers,
        refreshUsers,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
