"use client"

import { useEffect, useState } from "react"
import { Shield, Plus, Pencil, Trash2, X, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/sonner"
import api from "@/lib/api"

interface Role {
    id: string
    name: string
    label: string
    can_access_admin: boolean
}

const emptyForm = { name: "", label: "", can_access_admin: false }

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editRole, setEditRole] = useState<Role | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null)
    const [deleting, setDeleting] = useState(false)

    const fetchRoles = async () => {
        try {
            const res = await api.get("/roles")
            setRoles(res.data.data || [])
        } catch {
            toast.error("Failed to load roles")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetchRoles() }, [])

    const openCreate = () => {
        setEditRole(null)
        setForm(emptyForm)
        setDialogOpen(true)
    }

    const openEdit = (role: Role) => {
        setEditRole(role)
        setForm({ name: role.name, label: role.label, can_access_admin: role.can_access_admin })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.label) { toast.error("Label is required"); return }
        if (!editRole && !form.name) { toast.error("Name is required"); return }
        setSaving(true)
        try {
            if (editRole) {
                await api.put(`/roles/${editRole.id}`, {
                    label: form.label,
                    can_access_admin: form.can_access_admin,
                })
                toast.success("Role updated")
            } else {
                await api.post("/roles", form)
                toast.success("Role created")
            }
            setDialogOpen(false)
            await fetchRoles()
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to save role")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteConfirm) return
        setDeleting(true)
        try {
            await api.delete(`/roles/${deleteConfirm.id}`)
            toast.success("Role deleted")
            setDeleteConfirm(null)
            await fetchRoles()
        } catch {
            toast.error("Failed to delete role")
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Roles</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Kelola role dan hak akses admin panel
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">{roles.length} roles</Badge>
                    <Button size="sm" className="gap-2" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Tambah Role
                    </Button>
                </div>
            </div>

            {/* Info */}
            <Card className="border shadow-none bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30">
                <CardContent className="p-4 text-sm text-blue-700 dark:text-blue-400">
                    <strong>can_access_admin</strong> — jika aktif, user dengan role ini bisa mengakses admin panel SSO.
                    Role yang tidak punya akses admin hanya bisa login dan melihat dashboard.
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
                </div>
            ) : (
                <Card className="border shadow-none">
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {roles.map((role) => (
                                <div key={role.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors group">
                                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                        <Shield className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm">{role.label}</p>
                                            <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                                {role.name}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {role.can_access_admin ? (
                                            <Badge className="text-xs gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                                                <Check className="h-3 w-3" />
                                                Admin Access
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-xs gap-1">
                                                <X className="h-3 w-3" />
                                                No Admin Access
                                            </Badge>
                                        )}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(role)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost" size="icon"
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={() => setDeleteConfirm(role)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{editRole ? "Edit Role" : "Tambah Role"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {!editRole && (
                            <div className="space-y-1.5">
                                <Label htmlFor="role-name">
                                    Name <span className="text-destructive">*</span>
                                    <span className="text-xs text-muted-foreground ml-1">(tidak bisa diubah setelah dibuat)</span>
                                </Label>
                                <Input
                                    id="role-name"
                                    value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
                                    placeholder="marketing"
                                />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Label htmlFor="role-label">Label <span className="text-destructive">*</span></Label>
                            <Input
                                id="role-label"
                                value={form.label}
                                onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
                                placeholder="Tim Marketing"
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                            <div>
                                <p className="text-sm font-medium">Admin Panel Access</p>
                                <p className="text-xs text-muted-foreground">Bisa mengakses halaman admin SSO</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, can_access_admin: !f.can_access_admin }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.can_access_admin ? "bg-primary" : "bg-muted-foreground/30"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.can_access_admin ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Menyimpan..." : editRole ? "Simpan" : "Buat"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Role</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Hapus role <span className="font-medium text-foreground">{deleteConfirm?.label}</span>?
                        User yang memiliki role ini tidak otomatis terhapus, tetapi akses mereka mungkin terpengaruh.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Batal</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? "Menghapus..." : "Hapus"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
