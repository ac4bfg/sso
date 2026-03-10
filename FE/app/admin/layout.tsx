"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { toast } from "@/components/ui/sonner"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading } = useAuth()
    const router = useRouter()
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/login")
        }
        if (!isLoading && isAuthenticated && !user?.can_access_admin) {
            toast.error("Access denied", { description: "You need admin privileges to access this area." })
            router.replace("/dashboard")
        }
    }, [isLoading, isAuthenticated, user, router])

    useEffect(() => {
        if (isAuthenticated && sessionStorage.getItem("login_toast") === "true") {
            sessionStorage.removeItem("login_toast")
            setTimeout(() => {
                toast.success("Login berhasil", { description: `Selamat datang, ${user?.name}` })
            }, 100)
        }
    }, [isAuthenticated, user])

    if (isLoading || !isAuthenticated) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user?.can_access_admin) {
        return null
    }

    return (
        <div className="h-screen flex overflow-hidden bg-background">
            {/* Sidebar */}
            <div className={`hidden md:flex flex-col transition-all duration-300 ${isCollapsed ? "w-20" : "w-72"}`}>
                <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
                    {children}
                </main>
            </div>
        </div>
    )
}
