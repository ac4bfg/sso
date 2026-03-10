"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    ArrowLeft,
    Shield,
    Calendar,
    AppWindow,
    Plus,
    Trash2,
    Key,
    CheckCircle2,
    XCircle,
    ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "@/components/ui/sonner"
import api from "@/lib/api"

interface User {
    id: string
    name: string
    email: string
    role: string
    role_label: string
    is_active: boolean
    is_password_set: boolean
    last_login_at: string | null
    created_at: string
}

interface AppWithRole {
    id: string
    name: string
    description: string
    icon: string
    base_url: string
    role: string
}

interface App {
    id: string
    name: string
    description: string
    icon: string
    base_url: string
    is_active: boolean
    allowed_roles: string
}

interface Role {
    id: string
    name: string
    label: string
    can_access_admin: boolean
}

function parseAllowedRoles(raw: string | string[]): string[] {
    if (Array.isArray(raw)) return raw
    try { return JSON.parse(raw) } catch { return [] }
}

function getRoleLabel(roleName: string, allRoles: Role[]): string {
    return allRoles.find((r) => r.name === roleName)?.label ?? roleName
}

const roleColors: Record<string, string> = {
    admin: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    staff: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
}

export default function UserDetailPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.id as string

    const [user, setUser] = useState<User | null>(null)
    const [userApps, setUserApps] = useState<AppWithRole[]>([])
    const [allApps, setAllApps] = useState<App[]>([])
    const [allRoles, setAllRoles] = useState<Role[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchData = async () => {
        try {
            const [userRes, appsRes, allAppsRes, rolesRes] = await Promise.all([
                api.get(`/users/${userId}`),
                api.get(`/users/${userId}/apps`),
                api.get("/apps"),
                api.get("/roles"),
            ])
            setUser(userRes.data.data)
            setUserApps(appsRes.data.data || [])
            setAllApps(allAppsRes.data.data || [])
            setAllRoles(rolesRes.data.data || [])
        } catch {
            toast.error("Failed to load user data")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [userId])

    const handleChangeRole = async (newRole: string) => {
        try {
            await api.patch(`/users/${userId}/role`, { role: newRole })
            toast.success("Role updated successfully")
            fetchData()
        } catch {
            toast.error("Failed to update role")
        }
    }

    const handleAssignApp = async (appId: string, role: string) => {
        try {
            await api.post(`/users/${userId}/apps`, { app_id: appId, role })
            toast.success("App assigned successfully")
            fetchData()
        } catch {
            toast.error("Failed to assign app")
        }
    }

    const handleRevokeApp = async (appId: string, appName: string) => {
        if (!confirm(`Revoke access to "${appName}"?`)) return
        try {
            await api.delete(`/users/${userId}/apps/${appId}`)
            toast.success("App access revoked")
            fetchData()
        } catch {
            toast.error("Failed to revoke app access")
        }
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Never"
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const initials = (name: string) =>
        name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

    const unassignedApps = allApps.filter(
        (app) => !userApps.some((ua) => ua.id === app.id)
    )

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="h-64 bg-muted animate-pulse rounded-xl" />
                    <div className="lg:col-span-2 h-64 bg-muted animate-pulse rounded-xl" />
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="text-center py-16 text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>User not found</p>
                <Button variant="ghost" className="mt-4" onClick={() => router.push("/admin/users")}>
                    Back to Users
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/admin/users")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">User Detail</h1>
                    <p className="text-sm text-muted-foreground">Manage user profile and app access</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: User Profile */}
                <div className="space-y-4">
                    <Card className="border shadow-none">
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center text-center gap-3">
                                <Avatar className="h-16 w-16">
                                    <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-xl font-bold">
                                        {initials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-lg">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${roleColors[user.role] || roleColors.staff}`}>
                                    {user.role_label || user.role}
                                </span>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Status
                                    </span>
                                    <Badge variant={user.is_active ? "default" : "destructive"} className="text-xs">
                                        {user.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Key className="h-4 w-4" />
                                        Password
                                    </span>
                                    <span className="text-xs font-medium">
                                        {user.is_password_set ? "Set" : "Not set"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Last Login
                                    </span>
                                    <span className="text-xs">{formatDate(user.last_login_at)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Created
                                    </span>
                                    <span className="text-xs">{formatDate(user.created_at)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary" />
                                Change Role
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                            {allRoles.map((r) => (
                                <Button
                                    key={r.name}
                                    variant={user.role === r.name ? "default" : "outline"}
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => handleChangeRole(r.name)}
                                    disabled={user.role === r.name}
                                >
                                    <Shield className="h-4 w-4 mr-2 shrink-0" />
                                    <span className="flex-1 text-left">{r.label}</span>
                                    {r.can_access_admin && (
                                        <span className="text-xs opacity-60 ml-1">admin</span>
                                    )}
                                </Button>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: App Access */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="border shadow-none">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <AppWindow className="h-4 w-4 text-primary" />
                                        Application Access
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        {userApps.length} app{userApps.length !== 1 ? "s" : ""} assigned
                                    </CardDescription>
                                </div>
                                {unassignedApps.length > 0 && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="sm" className="gap-1.5">
                                                <Plus className="h-4 w-4" />
                                                Assign App
                                                <ChevronDown className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuLabel>Available Apps</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {unassignedApps.map((app) => (
                                                <DropdownMenu key={app.id}>
                                                    <DropdownMenuTrigger asChild>
                                                        <DropdownMenuItem className="cursor-pointer justify-between" onSelect={(e) => e.preventDefault()}>
                                                            <span className="flex items-center gap-2">
                                                                <span>{app.icon || "🚀"}</span>
                                                                {app.name}
                                                            </span>
                                                            <ChevronDown className="h-3 w-3" />
                                                        </DropdownMenuItem>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent side="left" className="w-40">
                                                        <DropdownMenuLabel className="text-xs">Assign as</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {parseAllowedRoles(app.allowed_roles).map((role) => (
                                                            <DropdownMenuItem
                                                                key={role}
                                                                className="cursor-pointer"
                                                                onClick={() => handleAssignApp(app.id, role)}
                                                            >
                                                                {getRoleLabel(role, allRoles)}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {userApps.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    <AppWindow className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No apps assigned yet</p>
                                    <p className="text-xs mt-1">Use the "Assign App" button to grant access</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {userApps.map((app) => (
                                        <div
                                            key={app.id}
                                            className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/40 transition-colors"
                                        >
                                            <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg bg-muted">
                                                {app.icon || "🚀"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm">{app.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{app.base_url}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                                            {getRoleLabel(app.role, allRoles)}
                                                            <ChevronDown className="h-3 w-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel className="text-xs">Change role</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {parseAllowedRoles(allApps.find((a) => a.id === app.id)?.allowed_roles ?? "").filter((r) => r !== app.role).map((role) => (
                                                            <DropdownMenuItem
                                                                key={role}
                                                                className="cursor-pointer"
                                                                onClick={() => handleAssignApp(app.id, role)}
                                                            >
                                                                {getRoleLabel(role, allRoles)}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    onClick={() => handleRevokeApp(app.id, app.name)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
