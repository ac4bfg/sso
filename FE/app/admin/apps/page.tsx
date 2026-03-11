"use client"

import { useEffect, useState } from "react"
import {
    AppWindow,
    Globe,
    Search,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Plus,
    Pencil,
    PowerOff,
    Power,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/sonner"
import api from "@/lib/api"

interface App {
    id: string
    name: string
    description: string
    icon: string
    base_url: string
    is_active: boolean
    allowed_roles: string[]
}

interface AppRaw {
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

const emptyForm = { name: "", description: "", icon: "", base_url: "", is_active: true, allowed_roles: [] as string[] }

export default function AppsPage() {
    const [apps, setApps] = useState<App[]>([])
    const [filtered, setFiltered] = useState<App[]>([])
    const [allRoles, setAllRoles] = useState<Role[]>([])
    const [search, setSearch] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [editApp, setEditApp] = useState<App | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)


    const fetchApps = async () => {
        try {
            const [appsRes, rolesRes] = await Promise.all([
                api.get("/apps"),
                api.get("/roles"),
            ])
            const raw: AppRaw[] = appsRes.data.data || []
            const parsed: App[] = raw.map((a) => ({ ...a, allowed_roles: parseAllowedRoles(a.allowed_roles) }))
            setApps(parsed)
            setFiltered(parsed)
            setAllRoles(rolesRes.data.data || [])
        } catch {
            toast.error("Failed to load applications")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetchApps() }, [])

    useEffect(() => {
        const q = search.toLowerCase()
        setFiltered(
            apps.filter(
                (a) =>
                    a.name.toLowerCase().includes(q) ||
                    a.description?.toLowerCase().includes(q) ||
                    a.base_url.toLowerCase().includes(q)
            )
        )
    }, [search, apps])

    const openCreate = () => {
        setEditApp(null)
        setForm({ ...emptyForm, allowed_roles: allRoles.map((r) => r.name) })
        setDialogOpen(true)
    }

    const openEdit = (app: App) => {
        setEditApp(app)
        setForm({
            name: app.name,
            description: app.description || "",
            icon: app.icon || "",
            base_url: app.base_url,
            is_active: app.is_active,
            allowed_roles: [...app.allowed_roles],
        })
        setDialogOpen(true)
    }

    const handleToggleActive = async (app: App) => {
        try {
            await api.put(`/apps/${app.id}`, { is_active: !app.is_active })
            toast.success(app.is_active ? `"${app.name}" disabled` : `"${app.name}" enabled`)
            await fetchApps()
        } catch {
            toast.error("Failed to update application status")
        }
    }

    const toggleRole = (roleName: string) => {
        setForm((f) => ({
            ...f,
            allowed_roles: f.allowed_roles.includes(roleName)
                ? f.allowed_roles.filter((r) => r !== roleName)
                : [...f.allowed_roles, roleName],
        }))
    }

    const handleSave = async () => {
        if (!form.name || !form.base_url) {
            toast.error("Name and Base URL are required")
            return
        }
        setSaving(true)
        try {
            if (editApp) {
                await api.put(`/apps/${editApp.id}`, { ...form, is_active: form.is_active })
                toast.success("Application updated")
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { is_active: _, ...createPayload } = form
                await api.post("/apps", createPayload)
                toast.success("Application created")
            }
            setDialogOpen(false)
            await fetchApps()
        } catch {
            toast.error("Failed to save application")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Applications</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        All registered applications in the SSO system
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                        {apps.length} applications
                    </Badge>
                    <Button size="sm" className="gap-2" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Add App
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                    { label: "Total", value: apps.length, icon: AppWindow, color: "text-primary", bg: "bg-primary/10" },
                    { label: "Active", value: apps.filter((a) => a.is_active).length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20" },
                    { label: "Inactive", value: apps.filter((a) => !a.is_active).length, icon: XCircle, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/20" },
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

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search applications..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <AppWindow className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No applications found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((app) => (
                        <Card key={app.id} className="border shadow-none hover:border-primary/40 hover:shadow-sm transition-all group">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className={`text-3xl w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${app.is_active ? "bg-muted group-hover:bg-primary/10" : "bg-muted/50 opacity-60"}`}>
                                        {app.icon || "🚀"}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => openEdit(app)}
                                            title="Edit"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity ${app.is_active ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"}`}
                                            onClick={() => handleToggleActive(app)}
                                            title={app.is_active ? "Disable" : "Enable"}
                                        >
                                            {app.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <Badge variant={app.is_active ? "default" : "secondary"} className="text-xs">
                                        {app.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <div className="mt-2">
                                    <p className={`font-semibold text-sm ${!app.is_active ? "text-muted-foreground" : ""}`}>{app.name}</p>
                                    {app.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{app.description}</p>
                                    )}
                                </div>
                                {app.allowed_roles.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {app.allowed_roles.map((r) => {
                                            const roleObj = allRoles.find((role) => role.name === r)
                                            return (
                                                <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                    {roleObj?.label ?? r}
                                                </span>
                                            )
                                        })}
                                    </div>
                                )}
                                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Globe className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{app.base_url}</span>
                                    <a
                                        href={app.base_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary/80"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editApp ? "Edit Application" : "Add Application"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="app-name">Name <span className="text-destructive">*</span></Label>
                            <Input id="app-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="My Application" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="app-desc">Description</Label>
                            <Input id="app-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="app-icon">Icon (emoji)</Label>
                            <Input id="app-icon" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} placeholder="🚀" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="app-url">Base URL <span className="text-destructive">*</span></Label>
                            <Input id="app-url" value={form.base_url} onChange={(e) => setForm((f) => ({ ...f, base_url: e.target.value }))} placeholder="https://app.example.com" />
                        </div>
                        {editApp && (
                            <div className="flex items-center justify-between py-1">
                                <div>
                                    <Label>Status</Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">Application can be accessed by users</p>
                                </div>
                                <Switch
                                    checked={form.is_active}
                                    onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                                />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Label>Allowed Roles</Label>
                            <div className="flex flex-wrap gap-2 p-3 rounded-md border bg-background min-h-10">
                                {allRoles.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No roles found</p>
                                ) : allRoles.map((r) => {
                                    const active = form.allowed_roles.includes(r.name)
                                    return (
                                        <button
                                            key={r.name}
                                            type="button"
                                            onClick={() => toggleRole(r.name)}
                                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                                active
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                                            }`}
                                        >
                                            {r.label}
                                        </button>
                                    )
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">Click to toggle. Selected roles can be assigned to users for this app.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : editApp ? "Save Changes" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
