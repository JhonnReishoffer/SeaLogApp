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

  // Templates
  templates: FormTemplate[]

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
  const [initialized, setInitialized] = useState(false)

  // Initialize store and load data
  useEffect(() => {
    store.initializeStore()
    const user = store.getCurrentUser()
    setCurrentUser(user)
    setVessels(store.getVessels())
    setSelectedVessel(store.getSelectedVessel())
    setTemplates(store.getTemplates())
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
        company: "",
        role: "operador",
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
        company: "",
        role: "operador",
        createdAt: new Date().toISOString(),
      }
      store.createUser(existingUser)
      setAllUsers(store.getUsers())
    }
    store.setCurrentUser(existingUser)
    setCurrentUser(existingUser)
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
    // Refresh vessels if company changed
    setVessels(store.getVessels())
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

  // Entry functions
  const refreshEntries = useCallback(() => {
    setEntries(store.getEntries())
  }, [])

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
        templates,
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
