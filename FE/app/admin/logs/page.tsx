"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
    Loader2, Activity, RefreshCw, Search, CheckCircle2, XCircle,
    LogIn, LogOut, UserPlus, AlertCircle, Monitor,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination"

interface LogEntry {
    id: string
    user_id: string
    user_name: string
    email: string
    event_type: string
    success: boolean
    ip_address: string
    user_agent: string
    created_at: string
}

const eventLabels: Record<string, string> = {
    login_success: "Login berhasil",
    login_failed: "Login gagal",
    logout: "Logout",
    register: "Registrasi",
    token_refresh: "Sesi diperbarui",
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

function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("id-ID", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    })
}

export default function LogsPage() {
    const { isAuthenticated, isLoading } = useAuth()

    const [logs, setLogs] = useState<LogEntry[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const limit = 20

    // loading: true only for the very first fetch (shows skeleton)
    // fetching: true for subsequent fetches (shows overlay spinner)
    const [loading, setLoading] = useState(true)
    const [fetching, setFetching] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const initialFetchDone = useRef(false)

    const [eventTypeFilter, setEventTypeFilter] = useState("all")
    const [successFilter, setSuccessFilter] = useState("all")
    const [searchInput, setSearchInput] = useState("")
    const [searchEmail, setSearchEmail] = useState("")
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleSearchChange = (val: string) => {
        setSearchInput(val)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setSearchEmail(val)
            setPage(1)
        }, 400)
    }

    const fetchLogs = useCallback(async (isRefresh = false) => {
        const token = localStorage.getItem("access_token")
        if (!token) return
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api"

        if (isRefresh) {
            setRefreshing(true)
        } else if (!initialFetchDone.current) {
            setLoading(true)
        } else {
            setFetching(true)
        }

        const params = new URLSearchParams()
        params.set("page", String(page))
        params.set("limit", String(limit))
        if (eventTypeFilter !== "all") params.set("event_type", eventTypeFilter)
        if (successFilter === "success") params.set("success", "true")
        if (successFilter === "failed") params.set("success", "false")
        if (searchEmail) params.set("email", searchEmail)

        try {
            const res = await fetch(`${apiUrl}/admin/logs?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await res.json()
            if (data.data) {
                setLogs(data.data.logs || [])
                setTotal(data.data.total || 0)
                initialFetchDone.current = true
            }
        } catch {
            // silent
        } finally {
            setLoading(false)
            setFetching(false)
            setRefreshing(false)
        }
    }, [page, eventTypeFilter, successFilter, searchEmail])

    useEffect(() => {
        if (isAuthenticated) fetchLogs()
    }, [isAuthenticated, fetchLogs])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    const getPageNumbers = () => {
        const pages: (number | "ellipsis")[] = []
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
            pages.push(1)
            if (page > 3) pages.push("ellipsis")
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
            if (page < totalPages - 2) pages.push("ellipsis")
            pages.push(totalPages)
        }
        return pages
    }

    const handleFilterChange = (setter: (v: string) => void) => (val: string) => {
        setter(val)
        setPage(1)
    }

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Activity Logs</h1>
                        <p className="text-xs text-muted-foreground">Monitor semua aktivitas autentikasi sistem</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchLogs(true)}
                    disabled={refreshing || fetching}
                    className="gap-1.5"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <Card className="border shadow-none">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-48">
                            <p className="text-xs text-muted-foreground mb-1.5">Cari email</p>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="user@email.com"
                                    value={searchInput}
                                    onChange={e => handleSearchChange(e.target.value)}
                                    className="h-9 text-sm pl-8"
                                />
                            </div>
                        </div>
                        <div className="w-44">
                            <p className="text-xs text-muted-foreground mb-1.5">Tipe event</p>
                            <Select value={eventTypeFilter} onValueChange={handleFilterChange(setEventTypeFilter)}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua event</SelectItem>
                                    <SelectItem value="login_success">Login berhasil</SelectItem>
                                    <SelectItem value="login_failed">Login gagal</SelectItem>
                                    <SelectItem value="logout">Logout</SelectItem>
                                    <SelectItem value="register">Registrasi</SelectItem>
                                    <SelectItem value="token_refresh">Token refresh</SelectItem>
                                    <SelectItem value="account_locked">Akun dikunci</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-36">
                            <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                            <Select value={successFilter} onValueChange={handleFilterChange(setSuccessFilter)}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="success">Berhasil</SelectItem>
                                    <SelectItem value="failed">Gagal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {(eventTypeFilter !== "all" || successFilter !== "all" || searchEmail) && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground"
                                onClick={() => {
                                    setEventTypeFilter("all")
                                    setSuccessFilter("all")
                                    setSearchInput("")
                                    setSearchEmail("")
                                    setPage(1)
                                }}
                            >
                                Reset filter
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border shadow-none">
                <CardHeader className="pb-3 flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                        {loading ? "Memuat..." : `${total.toLocaleString("id-ID")} log ditemukan`}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {fetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                        {!loading && <p className="text-xs text-muted-foreground">Halaman {page} dari {totalPages}</p>}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        /* Skeleton — hanya saat pertama kali load */
                        <div className="divide-y">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 px-6 py-4">
                                    <div className="w-7 h-7 rounded-full bg-muted animate-pulse shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
                                        <div className="h-2.5 bg-muted animate-pulse rounded w-1/2" />
                                    </div>
                                    <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
                                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Setelah load pertama — konten tetap tampil, hanya di-dim saat fetching */
                        <div className={`transition-opacity duration-150 ${fetching ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
                            {logs.length === 0 ? (
                                <div className="text-center py-16 text-muted-foreground">
                                    <Monitor className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm font-medium">Tidak ada log ditemukan</p>
                                    <p className="text-xs mt-1 opacity-70">Coba ubah filter atau reset pencarian</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {logs.map(log => (
                                        <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${log.success ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400"}`}>
                                                {log.success
                                                    ? (eventIcons[log.event_type] ?? <CheckCircle2 className="h-3.5 w-3.5" />)
                                                    : <XCircle className="h-3.5 w-3.5" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium leading-snug">
                                                    {log.user_name || "—"}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">{log.email}</p>
                                            </div>

                                            <div className="shrink-0">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs font-normal border-transparent ${log.success
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    }`}
                                                >
                                                    {eventLabels[log.event_type] ?? log.event_type}
                                                </Badge>
                                            </div>

                                            <div className="shrink-0 text-right min-w-28">
                                                {log.ip_address && (
                                                    <p className="text-xs font-mono text-muted-foreground">{log.ip_address}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(log.created_at)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {logs.length > 0 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t">
                                    <p className="text-xs text-muted-foreground">
                                        Menampilkan {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} dari {total.toLocaleString("id-ID")}
                                    </p>
                                    {totalPages > 1 && (
                                        <Pagination className="w-auto mx-0">
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                    />
                                                </PaginationItem>
                                                {getPageNumbers().map((pageNum, idx) => (
                                                    <PaginationItem key={idx}>
                                                        {pageNum === "ellipsis" ? (
                                                            <PaginationEllipsis />
                                                        ) : (
                                                            <PaginationLink
                                                                onClick={() => setPage(pageNum)}
                                                                isActive={page === pageNum}
                                                                className="cursor-pointer"
                                                            >
                                                                {pageNum}
                                                            </PaginationLink>
                                                        )}
                                                    </PaginationItem>
                                                ))}
                                                <PaginationItem>
                                                    <PaginationNext
                                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                        className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    )
}
