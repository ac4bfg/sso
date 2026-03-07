"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Loader2, Laptop, Smartphone, Globe, LogOut, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/sonner"
import api from "@/lib/api"
import { Badge } from "@/components/ui/badge"

interface Session {
    id: string
    user_agent: string
    ip_address: string
    last_used_at: string
    created_at: string
    is_current: boolean
}

export function SessionList() {
    const [sessions, setSessions] = useState<Session[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRevoking, setIsRevoking] = useState<string | null>(null)

    const fetchSessions = async () => {
        try {
            const { data } = await api.get("/sessions")
            setSessions(data.data)
        } catch (error) {
            console.error("Failed to fetch sessions:", error)
            toast.error("Failed to load sessions")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSessions()
    }, [])

    const handleRevoke = async (id: string, isCurrent: boolean) => {
        if (isCurrent && !confirm("This is your current session. Are you sure you want to log out?")) {
            return
        }

        setIsRevoking(id)
        try {
            await api.delete(`/sessions/${id}`)
            toast.success("Session revoked")

            if (isCurrent) {
                // If revoked current session, force logout
                window.location.href = "/login"
            } else {
                // Remove from list
                setSessions((prev) => prev.filter((s) => s.id !== id))
            }
        } catch (error) {
            console.error("Failed to revoke session:", error)
            toast.error("Failed to revoke session")
        } finally {
            setIsRevoking(null)
        }
    }

    const getDeviceIcon = (userAgent: string) => {
        const ua = userAgent.toLowerCase()
        if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
            return <Smartphone className="h-5 w-5 text-zinc-500" />
        }
        return <Laptop className="h-5 w-5 text-zinc-500" />
    }

    const getBrowserName = (userAgent: string) => {
        const ua = userAgent.toLowerCase()
        if (ua.includes("edg/")) return "Edge"
        if (ua.includes("chrome/")) return "Chrome"
        if (ua.includes("firefox/")) return "Firefox"
        if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari"
        return "Unknown Browser"
    }

    const getOSName = (userAgent: string) => {
        const ua = userAgent.toLowerCase()
        if (ua.includes("windows")) return "Windows"
        if (ua.includes("mac os")) return "macOS"
        if (ua.includes("linux")) return "Linux"
        if (ua.includes("android")) return "Android"
        if (ua.includes("ios") || ua.includes("iphone")) return "iOS"
        return "Unknown OS"
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>Manage your active sessions and devices.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                    Manage the devices logged into your account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="flex items-start justify-between pb-6 last:pb-0 last:border-0 border-b border-zinc-100 dark:border-zinc-800"
                        >
                            <div className="flex items-start gap-4">
                                <div className="mt-1 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                    {getDeviceIcon(session.user_agent)}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                            {getBrowserName(session.user_agent)} on {getOSName(session.user_agent)}
                                        </h4>
                                        {session.is_current && (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 border-0">
                                                Current Session
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-sm text-zinc-500 flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-3 w-3" />
                                            <span>{session.ip_address}</span>
                                        </div>
                                        <span className="text-xs">
                                            Last active: {formatDistanceToNow(new Date(session.last_used_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevoke(session.id, session.is_current)}
                                disabled={!!isRevoking || session.is_current}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRevoking === session.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    session.is_current ? "Current" : "Revoke"
                                )}
                            </Button>
                        </div>
                    ))}

                    {sessions.length === 0 && (
                        <div className="text-center py-8 text-zinc-500">
                            No active sessions found.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
