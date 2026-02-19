"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/app-provider"

export default function Home() {
  const router = useRouter()
  const { currentUser } = useApp()

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role !== "SUPER_ADMIN" && !currentUser.companyId) {
        router.replace("/setup-empresa")
      } else {
        router.replace("/dashboard")
      }
    } else {
      router.replace("/login")
    }
  }, [currentUser, router])

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}
