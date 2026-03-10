"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
    Users,
    Search,
    ChevronRight,
    MoreHorizontal,
    UserCheck,
    UserX,
    Shield,
    Mail,
    Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card"
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

interface Role {
    id: string
    name: string
    label: string
    can_access_admin: boolean
}

const roleColors: Record<string, string> = {
    admin: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    staff: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
}

export default function UsersPage() {
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [filtered, setFiltered] = useState<User[]>([])
    const [allRoles, setAllRoles] = useState<Role[]>([])
    const [search, setSearch] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    const fetchUsers = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get("/users"),
                api.get("/roles"),
            ])
            setUsers(usersRes.data.data || [])
            setFiltered(usersRes.data.data || [])
            setAllRoles(rolesRes.data.data || [])
        } catch {
            toast.error("Failed to load users")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    useEffect(() => {
        const q = search.toLowerCase()
        setFiltered(
            users.filter(
                (u) =>
                    u.name.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    u.role.toLowerCase().includes(q)
            )
        )
    }, [search, users])

    const handleDelete = async (userId: string, userName: string) => {
        if (!confirm(`Delete user "${userName}"? This action cannot be undone.`)) return
        try {
            await api.delete(`/users/${userId}`)
            toast.success("User deleted")
            fetchUsers()
        } catch {
            toast.error("Failed to delete user")
        }
    }

    const handleChangeRole = async (userId: string, newRole: string) => {
        try {
            await api.patch(`/users/${userId}/role`, { role: newRole })
            toast.success("Role updated")
            fetchUsers()
        } catch {
            toast.error("Failed to update role")
        }
    }

    const initials = (name: string) =>
        name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Never"
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">User Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage user accounts, roles, and application access
                    </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                    {users.length} total users
                </Badge>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    {
                        label: "Total Users",
                        value: users.length,
                        icon: Users,
                        color: "text-primary",
                        bg: "bg-primary/10",
                    },
                    {
                        label: "Active",
                        value: users.filter((u) => u.is_active).length,
                        icon: UserCheck,
                        color: "text-green-600",
                        bg: "bg-green-100 dark:bg-green-900/20",
                    },
                    {
                        label: "Admins",
                        value: users.filter((u) => u.role === "admin").length,
                        icon: Shield,
                        color: "text-amber-600",
                        bg: "bg-amber-100 dark:bg-amber-900/20",
                    },
                    {
                        label: "Inactive",
                        value: users.filter((u) => !u.is_active).length,
                        icon: UserX,
                        color: "text-red-500",
                        bg: "bg-red-100 dark:bg-red-900/20",
                    },
                ].map((stat) => (
                    <Card key={stat.label} className="border shadow-none">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                <p className="text-xl font-bold">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Search + Table */}
            <Card className="border shadow-none">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or role..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="space-y-3 p-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No users found</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filtered.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors group"
                                >
                                    <Avatar className="h-9 w-9 shrink-0">
                                        <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-xs font-semibold">
                                            {initials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium truncate">{user.name}</p>
                                            {!user.is_active && (
                                                <Badge variant="destructive" className="text-xs py-0">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            {user.email}
                                        </p>
                                    </div>

                                    <div className="hidden sm:block">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[user.role] || roleColors.staff}`}>
                                            {user.role_label || user.role}
                                        </span>
                                    </div>

                                    <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground min-w-[120px]">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(user.last_login_at)}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="hidden group-hover:flex text-xs h-8"
                                            onClick={() => router.push(`/admin/users/${user.id}`)}
                                        >
                                            Manage
                                            <ChevronRight className="h-3 w-3 ml-1" />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() => router.push(`/admin/users/${user.id}`)}
                                                >
                                                    View details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                                    Change Role
                                                </DropdownMenuLabel>
                                                {allRoles.filter((r) => r.name !== user.role).map((r) => (
                                                    <DropdownMenuItem
                                                        key={r.name}
                                                        className="cursor-pointer"
                                                        onClick={() => handleChangeRole(user.id, r.name)}
                                                    >
                                                        Set as {r.label}
                                                    </DropdownMenuItem>
                                                ))}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-500 cursor-pointer"
                                                    onClick={() => handleDelete(user.id, user.name)}
                                                >
                                                    Delete user
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
