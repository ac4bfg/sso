"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Loader2, AppWindow, ExternalLink, Globe, Shield,
    Clock, User, Layers, ArrowRight, Sparkles,
    LogIn, LogOut, UserPlus, RefreshCw, AlertCircle,
    CheckCircle2, XCircle,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/sonner"

interface AppWithRole {
    id: string; name: string; description: string
    icon: string; base_url: string; role: string
}
interface AuditLog {
    id: string; event_type: string; success: boolean
    ip_address: string; created_at: string
}
interface LoginStat {
    date: string; success: number; failed: number
}

function getGreeting() {
    const h = new Date().getHours()
    if (h < 11) return "Selamat pagi"
    if (h < 15) return "Selamat siang"
    if (h < 18) return "Selamat sore"
    return "Selamat malam"
}

function formatLastLogin(dateStr: string | null) {
    if (!dateStr) return "Belum pernah login"
    const now = new Date()
    const date = new Date(dateStr)
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    if (diffMin < 1) return "Baru saja"
    if (diffMin < 60) return `${diffMin} menit lalu`
    if (diffHour < 24) return `${diffHour} jam lalu`
    if (diffDay < 7) return `${diffDay} hari lalu`
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

function formatRelative(dateStr: string) {
    const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    if (diffMin < 1) return "Baru saja"
    if (diffMin < 60) return `${diffMin} menit lalu`
    if (diffHour < 24) return `${diffHour} jam lalu`
    if (diffDay < 7) return `${diffDay} hari lalu`
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
}

const roleColors: Record<string, string> = {
    admin: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    staff: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
}
const roleGlobalColors: Record<string, { bg: string; text: string; dot: string }> = {
    admin: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-400" },
    manager: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-400" },
    staff: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600 dark:text-zinc-400", dot: "bg-zinc-400" },
}
const eventLabels: Record<string, string> = {
    login_success: "Login berhasil", login_failed: "Login gagal",
    logout: "Logout", register: "Registrasi", token_refresh: "Sesi diperbarui",
    account_locked: "Akun dikunci",
}
const eventIcons: Record<string, React.ReactNode> = {
    login_success: <LogIn className="h-3.5 w-3.5" />,
    login_failed: <AlertCircle className="h-3.5 w-3.5" />,
    logout: <LogOut className="h-3.5 w-3.5" />,
    register: <UserPlus className="h-3.5 w-3.5" />,
    token_refresh: <RefreshCw className="h-3.5 w-3.5" />,
    account_locked: <AlertCircle className="h-3.5 w-3.5" />,
}

export default function DashboardPage() {
    const { user, isAuthenticated, isLoading } = useAuth()
    const router = useRouter()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [apps, setApps] = useState<AppWithRole[]>([])
    const [appsLoading, setAppsLoading] = useState(true)
    const [activity, setActivity] = useState<AuditLog[]>([])
    const [activityLoading, setActivityLoading] = useState(true)
    const [loginStats, setLoginStats] = useState<LoginStat[]>([])
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.replace("/login")
    }, [isLoading, isAuthenticated, router])

    useEffect(() => {
        if (isAuthenticated && sessionStorage.getItem("login_toast") === "true") {
            sessionStorage.removeItem("login_toast")
            setTimeout(() => toast.success("Login berhasil", { description: `Selamat datang, ${user?.name}` }), 100)
        }
    }, [isAuthenticated, user])

    useEffect(() => {
        if (!isAuthenticated) return
        const token = localStorage.getItem("access_token")
        if (!token) return
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api"
        const h = { Authorization: `Bearer ${token}` }

        fetch(`${apiUrl}/user/apps`, { headers: h })
            .then(r => r.json()).then(d => setApps(d.data || []))
            .catch(() => {}).finally(() => setAppsLoading(false))

        fetch(`${apiUrl}/user/activity`, { headers: h })
            .then(r => r.json()).then(d => setActivity(d.data || []))
            .catch(() => {}).finally(() => setActivityLoading(false))

        fetch(`${apiUrl}/user/login-stats`, { headers: h })
            .then(r => r.json()).then(d => setLoginStats(d.data || []))
            .catch(() => {})
    }, [isAuthenticated])

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    if (isLoading || !isAuthenticated) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const roleStyle = roleGlobalColors[user?.role ?? ""] ?? roleGlobalColors.staff

    return (
        <div className="h-screen flex overflow-hidden bg-background">
            <div className={`hidden md:flex flex-col transition-all duration-300 ${isCollapsed ? "w-20" : "w-72"}`}>
                <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
                    <div className="space-y-6">

                        {/* Hero Greeting */}
                        <div className="relative rounded-2xl overflow-hidden bg-linear-to-br from-primary/90 to-primary p-6 text-primary-foreground shadow-sm">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white translate-x-20 -translate-y-20" />
                                <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white -translate-x-10 translate-y-10" />
                            </div>
                            <div className="relative flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles className="h-4 w-4 opacity-80" />
                                        <span className="text-sm opacity-80">{getGreeting()}</span>
                                    </div>
                                    <h1 className="text-2xl font-bold">{user?.name}</h1>
                                    <p className="text-sm opacity-75 mt-1">{user?.email}</p>
                                    <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`} />
                                        <span>{user?.role_label || user?.role}</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-2xl font-bold tabular-nums">
                                        {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                    <p className="text-xs opacity-75 mt-0.5">
                                        {currentTime.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stat Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <Card className="border shadow-none">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary/10">
                                        <Layers className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Aplikasi Diakses</p>
                                        <p className="text-2xl font-bold">{appsLoading ? "—" : apps.length}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border shadow-none">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/20">
                                        <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Status Akun</p>
                                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">Aktif</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border shadow-none col-span-2 md:col-span-1">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-muted">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground">Login Terakhir</p>
                                        <p className="text-sm font-medium truncate">{formatLastLogin(user?.last_login_at ?? null)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Admin shortcut */}
                        {user?.can_access_admin && (
                            <Card className="border shadow-none bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30">
                                <CardContent className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Admin Panel</p>
                                            <p className="text-xs text-amber-700/70 dark:text-amber-400/70">Kelola users, aplikasi, dan hak akses</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="shrink-0 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 gap-1.5"
                                        onClick={() => router.push("/admin/users")}
                                    >
                                        Buka Panel
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Chart + Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Login Activity Chart */}
                            <div className="lg:col-span-2">
                                <Card className="border shadow-none h-full">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <LogIn className="h-4 w-4 text-primary" />
                                            Aktivitas Login (7 Hari Terakhir)
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground">Login sukses & gagal di seluruh sistem</p>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        {loginStats.length === 0 ? (
                                            <div className="h-40 flex items-center justify-center text-muted-foreground text-xs">
                                                Belum ada data aktivitas login
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={160}>
                                                <BarChart data={loginStats.map(s => ({
                                                    ...s,
                                                    date: new Date(s.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                                                }))} barSize={14} barGap={4}>
                                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
                                                    <Tooltip
                                                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                                                        labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                                                        cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
                                                    />
                                                    <Bar dataKey="success" name="Berhasil" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="failed" name="Gagal" fill="hsl(var(--destructive) / 0.5)" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Activity Feed */}
                            <div>
                                <Card className="border shadow-none h-full">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-primary" />
                                            Aktivitas Saya
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {activityLoading ? (
                                            <div className="p-4 space-y-3">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-muted animate-pulse shrink-0" />
                                                        <div className="flex-1 space-y-1.5">
                                                            <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                                                            <div className="h-2.5 bg-muted animate-pulse rounded w-1/2" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : activity.length === 0 ? (
                                            <div className="text-center py-10 text-muted-foreground">
                                                <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                <p className="text-xs">Belum ada aktivitas</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y">
                                                {activity.map(log => (
                                                    <div key={log.id} className="flex items-start gap-3 p-4">
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${log.success ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400"}`}>
                                                            {log.success
                                                                ? (eventIcons[log.event_type] ?? <CheckCircle2 className="h-3.5 w-3.5" />)
                                                                : <XCircle className="h-3.5 w-3.5" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium leading-snug">
                                                                {eventLabels[log.event_type] ?? log.event_type}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                                <span className="text-xs text-muted-foreground">{formatRelative(log.created_at)}</span>
                                                                {log.ip_address && (
                                                                    <>
                                                                        <span className="text-muted-foreground/40 text-xs">·</span>
                                                                        <span className="text-xs text-muted-foreground font-mono">{log.ip_address}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Apps Section */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <AppWindow className="h-5 w-5 text-primary" />
                                <h2 className="text-base font-semibold">Aplikasi Anda</h2>
                                {!appsLoading && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                        {apps.length}
                                    </span>
                                )}
                            </div>

                            {appsLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
                                </div>
                            ) : apps.length === 0 ? (
                                <div className="text-center py-16 text-muted-foreground border rounded-2xl bg-card">
                                    <AppWindow className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm font-medium">Belum ada aplikasi</p>
                                    <p className="text-xs mt-1 opacity-70">Hubungi administrator untuk mendapatkan akses</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {apps.map(app => {
                                        const token = localStorage.getItem("access_token") || ""
                                        return (
                                            <a key={app.id} href={`${app.base_url}?access_token=${token}`} className="block group">
                                                <Card className="border shadow-none hover:border-primary/50 hover:shadow-md transition-all duration-200 h-full">
                                                    <CardContent className="p-5 flex flex-col gap-4 h-full">
                                                        <div className="flex items-start justify-between">
                                                            <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 transition-colors duration-200">
                                                                {app.icon || "🚀"}
                                                            </div>
                                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${roleColors[app.role] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                                                                {app.role}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{app.name}</p>
                                                            {app.description && (
                                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{app.description}</p>
                                                            )}
                                                        </div>
                                                        <Separator />
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Globe className="h-3 w-3 shrink-0" />
                                                            <span className="truncate">{app.base_url}</span>
                                                            <ExternalLink className="h-3 w-3 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </a>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                    </div>
                </main>
            </div>
        </div>
    )
}
