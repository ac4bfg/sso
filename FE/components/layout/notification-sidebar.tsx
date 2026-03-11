"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, AlertCircle, AlertTriangle, Info, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { formatDistanceToNow } from "date-fns"

interface Notification {
    id: string
    type: string
    title: string
    message: string
    user_name: string
    email: string
    ip_address: string
    is_read: boolean
    created_at: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api"

function notifIcon(type: string) {
    switch (type) {
        case "brute_force": return <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        case "new_ip_login": return <Shield className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
        case "password_reset": return <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        case "access_request": return <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        default: return <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
    }
}

function borderColor(type: string) {
    switch (type) {
        case "brute_force": return "border-l-red-500"
        case "new_ip_login": return "border-l-yellow-500"
        case "password_reset": return "border-l-blue-500"
        case "access_request": return "border-l-amber-500"
        default: return "border-l-muted-foreground"
    }
}

export function NotificationSidebar() {
    const { user } = useAuth()
    const router = useRouter()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const esRef = useRef<EventSource | null>(null)

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get("/admin/notifications")
            setNotifications(res.data.data.notifications || [])
            setUnreadCount(res.data.data.unread_count || 0)
        } catch {
            // silently fail
        }
    }, [])

    // Load initial + connect SSE — only for admins
    useEffect(() => {
        setIsMounted(true)
        if (!user?.can_access_admin) return

        fetchNotifications()

        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
        if (!token) return

        const es = new EventSource(`${API_BASE}/admin/notifications/stream?token=${token}`)
        esRef.current = es

        es.onmessage = (e) => {
            try {
                const notif: Notification = JSON.parse(e.data)
                setNotifications((prev) => [notif, ...prev])
                setUnreadCount((prev) => prev + 1)
            } catch {
                // ignore parse errors
            }
        }

        es.onerror = () => {
            // EventSource auto-reconnects on error
        }

        return () => {
            es.close()
            esRef.current = null
        }
    }, [user?.can_access_admin, fetchNotifications])

    const markRead = async (id: string) => {
        try {
            await api.post(`/admin/notifications/${id}/read`)
            setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
            setUnreadCount((prev) => Math.max(0, prev - 1))
        } catch {
            // silently fail
        }
    }

    const markAllRead = async () => {
        try {
            await api.post("/admin/notifications/read-all")
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
            setUnreadCount(0)
        } catch {
            // silently fail
        }
    }

    if (!isMounted || !user?.can_access_admin) return null

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative cursor-pointer hover:bg-muted">
                    <Bell className="h-5 w-5 text-muted-foreground hover:text-primary transition" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-background animate-pulse" />
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
                <SheetHeader className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <SheetTitle className="text-xl">Notifications</SheetTitle>
                            <SheetDescription>
                                {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "All caught up"}
                            </SheetDescription>
                        </div>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">
                                <Check className="mr-2 h-3 w-3" />
                                Mark all read
                            </Button>
                        )}
                    </div>
                </SheetHeader>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                        {notifications.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "flex gap-3 p-4 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                                        !n.is_read ? `bg-muted/30 border-l-4 ${borderColor(n.type)}` : "bg-background"
                                    )}
                                    onClick={() => {
                                        if (!n.is_read) markRead(n.id)
                                        if (n.type === "access_request") {
                                            setIsOpen(false)
                                            router.push("/admin/users?tab=requests")
                                        }
                                    }}
                                >
                                    {notifIcon(n.type)}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={cn("text-sm leading-snug", !n.is_read ? "font-semibold" : "font-medium")}>
                                                {n.title}
                                            </p>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                                        {n.ip_address && (
                                            <p className="text-xs text-muted-foreground font-mono">IP: {n.ip_address}</p>
                                        )}
                                    </div>
                                    {!n.is_read && (
                                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
