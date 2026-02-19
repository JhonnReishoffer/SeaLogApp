"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { currentUser } = useApp()

  useEffect(() => {
    if (!currentUser) {
      router.replace("/login")
      return
    }
    if (currentUser.role !== "SUPER_ADMIN" && !currentUser.companyId) {
      router.replace("/setup-empresa")
    }
  }, [currentUser, router])

  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && !currentUser.companyId)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
