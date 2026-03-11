"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
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
    UserPlus,
    Eye,
    EyeOff,
    Check,
    X,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronDown,
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "@/components/ui/sonner"
import { formatDistanceToNow } from "date-fns"
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

interface AccessRequest {
    id: string
    name: string
    email: string
    department: string
    reason: string
    status: "pending" | "approved" | "rejected"
    review_note: string
    reviewed_at: string | null
    created_at: string
}

const roleColors: Record<string, string> = {
    admin: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    staff: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
}

const emptyCreateForm = { name: "", email: "", password: "", role: "staff" }

function usePasswordValidation(password: string) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }
}

function statusBadge(status: string) {
    if (status === "pending") return <Badge variant="secondary" className="text-xs gap-1"><Clock className="h-3 w-3" />Pending</Badge>
    if (status === "approved") return <Badge className="text-xs gap-1 bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3" />Approved</Badge>
    return <Badge className="text-xs gap-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/30"><XCircle className="h-3 w-3" />Rejected</Badge>
}

// ─── Main page (wrapped in Suspense for useSearchParams) ───────────────────
function UsersPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const activeTab = (searchParams.get("tab") === "requests" ? "requests" : "users") as "users" | "requests"

    const setTab = (tab: "users" | "requests") => {
        router.push(`/admin/users${tab === "requests" ? "?tab=requests" : ""}`, { scroll: false })
    }

    // ── Users state ──
    const [users, setUsers] = useState<User[]>([])
    const [filtered, setFiltered] = useState<User[]>([])
    const [allRoles, setAllRoles] = useState<Role[]>([])
    const [search, setSearch] = useState("")
    const [usersLoading, setUsersLoading] = useState(true)

    const [createOpen, setCreateOpen] = useState(false)
    const [createForm, setCreateForm] = useState(emptyCreateForm)
    const [creating, setCreating] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const pwValidations = usePasswordValidation(createForm.password)
    const isPwValid = Object.values(pwValidations).every(Boolean)

    // ── Requests state ──
    const [requests, setRequests] = useState<AccessRequest[]>([])
    const [requestsLoading, setRequestsLoading] = useState(true)
    const [requestStatusFilter, setRequestStatusFilter] = useState("all")

    const [approveTarget, setApproveTarget] = useState<AccessRequest | null>(null)
    const [approveForm, setApproveForm] = useState({ role: "staff", password: "", note: "" })
    const [showApprovePassword, setShowApprovePassword] = useState(true)

    const generateDefaultPassword = (name: string) => {
        const first = name.trim().split(" ")[0]
        const capitalized = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
        const digits = String(Math.floor(1000 + Math.random() * 9000))
        return `${capitalized}@${digits}`
    }
    const [approving, setApproving] = useState(false)

    const [rejectTarget, setRejectTarget] = useState<AccessRequest | null>(null)
    const [rejectNote, setRejectNote] = useState("")
    const [rejecting, setRejecting] = useState(false)

    const [detailTarget, setDetailTarget] = useState<AccessRequest | null>(null)

    const approvePwValid = usePasswordValidation(approveForm.password)
    const isApprovePwValid = Object.values(approvePwValid).every(Boolean)

    // ── Fetch ──
    const fetchUsers = useCallback(async () => {
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
            setUsersLoading(false)
        }
    }, [])

    const fetchRequests = useCallback(async () => {
        try {
            const [reqRes, rolesRes] = await Promise.all([
                api.get("/admin/requests"),
                allRoles.length === 0 ? api.get("/roles") : Promise.resolve(null),
            ])
            setRequests(reqRes.data.data.requests || [])
            if (rolesRes) setAllRoles(rolesRes.data.data || [])
        } catch {
            toast.error("Failed to load requests")
        } finally {
            setRequestsLoading(false)
        }
    }, [allRoles.length])

    useEffect(() => { fetchUsers() }, [fetchUsers])
    useEffect(() => { fetchRequests() }, [fetchRequests])

    useEffect(() => {
        const q = search.toLowerCase()
        setFiltered(users.filter((u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
        ))
    }, [search, users])

    const pendingCount = requests.filter((r) => r.status === "pending").length

    const filteredRequests = requestStatusFilter === "all"
        ? requests
        : requests.filter((r) => r.status === requestStatusFilter)

    // ── User handlers ──
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

    const handleCreate = async () => {
        if (!createForm.name || !createForm.email || !createForm.password) {
            toast.error("Name, email, and password are required")
            return
        }
        setCreating(true)
        try {
            await api.post("/users", createForm)
            toast.success("User created successfully")
            setCreateOpen(false)
            setCreateForm(emptyCreateForm)
            fetchUsers()
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Failed to create user")
        } finally {
            setCreating(false)
        }
    }

    // ── Request handlers ──
    const handleApprove = async () => {
        if (!approveTarget) return
        setApproving(true)
        try {
            await api.post(`/admin/requests/${approveTarget.id}/approve`, {
                role: approveForm.role,
                password: approveForm.password,
                note: approveForm.note,
            })
            toast.success(`Access approved — account created for ${approveTarget.name}`)
            setApproveTarget(null)
            await Promise.all([fetchRequests(), fetchUsers()])
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } }
            toast.error(e.response?.data?.message || "Failed to approve request")
        } finally {
            setApproving(false)
        }
    }

    const handleReject = async () => {
        if (!rejectTarget) return
        setRejecting(true)
        try {
            await api.post(`/admin/requests/${rejectTarget.id}/reject`, { note: rejectNote })
            toast.success(`Request from ${rejectTarget.name} rejected`)
            setRejectTarget(null)
            setRejectNote("")
            fetchRequests()
        } catch {
            toast.error("Failed to reject request")
        } finally {
            setRejecting(false)
        }
    }

    const initials = (name: string) =>
        name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Never"
        return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
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
                <div className="flex items-center gap-3">
                    {activeTab === "users" && (
                        <>
                            <Badge variant="secondary" className="text-xs">{users.length} total users</Badge>
                            <Button size="sm" className="gap-1.5" onClick={() => { setCreateForm(emptyCreateForm); setShowPassword(false); setCreateOpen(true) }}>
                                <UserPlus className="h-4 w-4" />
                                Create User
                            </Button>
                        </>
                    )}
                    {activeTab === "requests" && pendingCount > 0 && (
                        <Badge className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50 hover:bg-orange-100 dark:hover:bg-orange-900/30">{pendingCount} pending</Badge>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Users", value: users.length, icon: Users, color: "text-primary", bg: "bg-primary/10" },
                    { label: "Active", value: users.filter((u) => u.is_active).length, icon: UserCheck, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20" },
                    { label: "Admins", value: users.filter((u) => u.role === "admin").length, icon: Shield, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/20" },
                    { label: "Pending Requests", value: pendingCount, icon: Clock, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/20" },
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

            {/* Tabs */}
            <div className="flex gap-1 border-b">
                <button
                    onClick={() => setTab("users")}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                        activeTab === "users"
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Users
                </button>
                <button
                    onClick={() => setTab("requests")}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                        activeTab === "requests"
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Access Requests
                    {pendingCount > 0 && (
                        <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold">
                            {pendingCount}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Tab: Users ── */}
            {activeTab === "users" && (
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
                        {usersLoading ? (
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
                                    <div key={user.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors group">
                                        <Avatar className="h-9 w-9 shrink-0">
                                            <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-xs font-semibold">
                                                {initials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium truncate">{user.name}</p>
                                                {!user.is_active && <Badge variant="destructive" className="text-xs py-0">Inactive</Badge>}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                                <Mail className="h-3 w-3" />{user.email}
                                            </p>
                                        </div>
                                        <div className="hidden sm:block">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[user.role] || roleColors.staff}`}>
                                                {user.role_label || user.role}
                                            </span>
                                        </div>
                                        <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground min-w-30">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(user.last_login_at)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" className="hidden group-hover:flex text-xs h-8" onClick={() => router.push(`/admin/users/${user.id}`)}>
                                                Manage <ChevronRight className="h-3 w-3 ml-1" />
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
                                                    <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/admin/users/${user.id}`)}>
                                                        View details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Change Role</DropdownMenuLabel>
                                                    {allRoles.filter((r) => r.name !== user.role).map((r) => (
                                                        <DropdownMenuItem key={r.name} className="cursor-pointer" onClick={() => handleChangeRole(user.id, r.name)}>
                                                            Set as {r.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-500 cursor-pointer" onClick={() => handleDelete(user.id, user.name)}>
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
            )}

            {/* ── Tab: Requests ── */}
            {activeTab === "requests" && (
                <div className="space-y-4">
                    {/* Filter */}
                    <div className="flex items-center gap-2">
                        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setRequestStatusFilter(s)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                                    requestStatusFilter === s
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                                }`}
                            >
                                {s === "all" ? "All Requests" : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>

                    {requestsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No requests found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredRequests.map((req) => (
                                <Card key={req.id} className="border shadow-none hover:border-primary/30 transition-all">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-sm">{req.name}</p>
                                                    {statusBadge(req.status)}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">{req.email}</p>
                                                {req.department && <p className="text-xs text-muted-foreground">{req.department}</p>}
                                                {req.reason && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">"{req.reason}"</p>}
                                                <p className="text-xs text-muted-foreground mt-1.5">
                                                    Submitted {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title="View details" onClick={() => setDetailTarget(req)}>
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                                {req.status === "pending" && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                                                            onClick={() => { setApproveTarget(req); setApproveForm({ role: "staff", password: generateDefaultPassword(req.name), note: "" }); setShowApprovePassword(true) }}
                                                        >
                                                            <Check className="h-3 w-3" />Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-200 dark:border-red-800/60 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                            onClick={() => { setRejectTarget(req); setRejectNote("") }}
                                                        >
                                                            <X className="h-3 w-3" />Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Create User Dialog ── */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-125">
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cu-name" className="text-right">Name <span className="text-destructive">*</span></Label>
                            <Input id="cu-name" className="col-span-3" value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cu-email" className="text-right">Email <span className="text-destructive">*</span></Label>
                            <Input id="cu-email" type="email" className="col-span-3" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} placeholder="user@example.com" />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="cu-password" className="text-right pt-2">Password <span className="text-destructive">*</span></Label>
                            <div className="col-span-3 space-y-2">
                                <div className="relative">
                                    <Input
                                        id="cu-password"
                                        type={showPassword ? "text" : "password"}
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                                        placeholder="Min. 8 characters"
                                        className="pr-9"
                                    />
                                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {createForm.password.length > 0 && (
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                                        {[
                                            { key: "length", label: "8+ chars" },
                                            { key: "uppercase", label: "Uppercase" },
                                            { key: "lowercase", label: "Lowercase" },
                                            { key: "number", label: "Number" },
                                            { key: "special", label: "Special" },
                                        ].map(({ key, label }) => (
                                            <span key={key} className={pwValidations[key as keyof typeof pwValidations] ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                                {pwValidations[key as keyof typeof pwValidations] ? "✓" : "○"} {label}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cu-role" className="text-right">Role</Label>
                            <Select value={createForm.role} onValueChange={(v) => setCreateForm((f) => ({ ...f, role: v }))}>
                                <SelectTrigger id="cu-role" className="col-span-3">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allRoles.map((r) => (
                                        <SelectItem key={r.name} value={r.name}>{r.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={creating || !isPwValid}>
                            {creating ? "Creating..." : "Create User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Approve Dialog ── */}
            <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Approve Access Request</DialogTitle>
                        <DialogDescription>
                            Create an account for <span className="font-medium text-foreground">{approveTarget?.name}</span> ({approveTarget?.email})
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Role</Label>
                            <Select value={approveForm.role} onValueChange={(v) => setApproveForm((f) => ({ ...f, role: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {allRoles.map((r) => <SelectItem key={r.name} value={r.name}>{r.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label>Initial Password <span className="text-destructive">*</span></Label>
                                <button
                                    type="button"
                                    onClick={() => setApproveForm((f) => ({ ...f, password: generateDefaultPassword(approveTarget?.name || "") }))}
                                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                                >
                                    Regenerate
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showApprovePassword ? "text" : "password"}
                                    placeholder="Set password for this user"
                                    value={approveForm.password}
                                    onChange={(e) => setApproveForm((f) => ({ ...f, password: e.target.value }))}
                                    className="pr-10"
                                />
                                <button type="button" onClick={() => setShowApprovePassword(!showApprovePassword)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                    {showApprovePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {approveForm.password.length > 0 && (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                                    {[
                                        { key: "length", label: "8+ characters" },
                                        { key: "uppercase", label: "Uppercase letter" },
                                        { key: "lowercase", label: "Lowercase letter" },
                                        { key: "number", label: "Number" },
                                        { key: "special", label: "Special character" },
                                    ].map(({ key, label }) => (
                                        <div key={key} className={`flex items-center gap-1.5 text-xs ${approvePwValid[key as keyof typeof approvePwValid] ? "text-green-600" : "text-muted-foreground"}`}>
                                            <div className={`h-1.5 w-1.5 rounded-full ${approvePwValid[key as keyof typeof approvePwValid] ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Note (optional)</Label>
                            <Input placeholder="Internal note" value={approveForm.note} onChange={(e) => setApproveForm((f) => ({ ...f, note: e.target.value }))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveTarget(null)}>Cancel</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={approving || !isApprovePwValid}>
                            {approving ? "Approving..." : "Approve & Create Account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Reject Dialog ── */}
            <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Reject Request</DialogTitle>
                        <DialogDescription>
                            Reject access request from <span className="font-medium text-foreground">{rejectTarget?.name}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5 py-2">
                        <Label>Reason (optional)</Label>
                        <Input placeholder="Reason for rejection" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleReject} disabled={rejecting}>
                            {rejecting ? "Rejecting..." : "Reject"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Detail Dialog ── */}
            <Dialog open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Request Details</DialogTitle></DialogHeader>
                    {detailTarget && (
                        <div className="space-y-3 py-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{detailTarget.name}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{detailTarget.email}</span></div>
                            {detailTarget.department && <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{detailTarget.department}</span></div>}
                            <div className="flex justify-between"><span className="text-muted-foreground">Status</span>{statusBadge(detailTarget.status)}</div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span><span>{formatDistanceToNow(new Date(detailTarget.created_at), { addSuffix: true })}</span></div>
                            {detailTarget.reason && (
                                <div className="space-y-1">
                                    <p className="text-muted-foreground">Reason</p>
                                    <p className="bg-muted rounded p-2 text-xs">{detailTarget.reason}</p>
                                </div>
                            )}
                            {detailTarget.review_note && (
                                <div className="space-y-1">
                                    <p className="text-muted-foreground">Review Note</p>
                                    <p className="bg-muted rounded p-2 text-xs">{detailTarget.review_note}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailTarget(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function UsersPage() {
    return (
        <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
            <UsersPageContent />
        </Suspense>
    )
}
