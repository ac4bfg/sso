"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LogOut, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/sonner"

export default function DashboardPage() {
    const { user, isAuthenticated, isLoading, logout } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/login")
        }
    }, [isLoading, isAuthenticated, router])

    useEffect(() => {
        if (isAuthenticated && sessionStorage.getItem("login_toast") === "true") {
            sessionStorage.removeItem("login_toast")
            setTimeout(() => {
                toast.success("Login berhasil", { description: `Selamat datang, ${user?.name}` })
            }, 100)
        }
    }, [isAuthenticated, user])

    const handleLogout = async () => {
        await logout()
        router.replace("/login")
    }

    if (isLoading || !isAuthenticated) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Navbar */}
            <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        KSM Internal
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="text-zinc-500 hover:text-red-500 gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        Keluar
                    </Button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <User className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{user?.name}</p>
                        <p className="text-sm text-zinc-500">{user?.email}</p>
                    </div>
                </div>

                <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
                    Pilih Aplikasi
                </h1>

                <div id="app-list" className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <AppLoader />
                </div>
            </main>
        </div>
    )
}

function AppLoader() {
    const { user } = useAuth()

    useEffect(() => {
        const token = localStorage.getItem("access_token")
        if (!token) return

        const ssoApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api"

        fetch(`${ssoApiUrl}/user/apps`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                const apps: { name: string; base_url: string; icon: string }[] = data.data || []
                const container = document.getElementById("app-list")
                if (!container) return
                container.innerHTML = apps.length === 0
                    ? `<p class="text-sm text-zinc-400 col-span-3">Tidak ada aplikasi tersedia.</p>`
                    : apps.map((app) => `
                        <a href="${app.base_url}?access_token=${token}"
                           class="flex flex-col items-center gap-3 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-400 hover:shadow-sm transition-all text-center">
                            <span class="text-3xl">${app.icon || "🚀"}</span>
                            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">${app.name}</span>
                        </a>`).join("")
            })
            .catch(() => {
                const container = document.getElementById("app-list")
                if (container) container.innerHTML = `<p class="text-sm text-red-400 col-span-3">Gagal memuat aplikasi.</p>`
            })
    }, [user])

    return (
        <>
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            ))}
        </>
    )
}
