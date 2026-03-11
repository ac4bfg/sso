"use client"

import { useEffect, useState, useRef } from "react"
import {
    UserPlus,
    Check,
    X,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronDown,
    Eye,
    EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/sonner"
import { formatDistanceToNow } from "date-fns"
import api from "@/lib/api"

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

interface Role {
    id: string
    name: string
    label: string
}

function usePasswordValidation(password: string) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }
}

const STATUS_FILTER_OPTIONS = [
    { value: "all", label: "All Requests" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
]

export default function RequestsPage() {
    const [requests, setRequests] = useState<AccessRequest[]>([])
    const [allRoles, setAllRoles] = useState<Role[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("all")
    const initialFetchDone = useRef(false)

    // Approve dialog
    const [approveTarget, setApproveTarget] = useState<AccessRequest | null>(null)
    const [approveForm, setApproveForm] = useState({ role: "staff", password: "", note: "" })
    const [showPassword, setShowPassword] = useState(false)
    const [approving, setApproving] = useState(false)

    // Reject dialog
    const [rejectTarget, setRejectTarget] = useState<AccessRequest | null>(null)
    const [rejectNote, setRejectNote] = useState("")
    const [rejecting, setRejecting] = useState(false)

    // Detail dialog
    const [detailTarget, setDetailTarget] = useState<AccessRequest | null>(null)

    const pwValid = usePasswordValidation(approveForm.password)
    const isPwValid = Object.values(pwValid).every(Boolean)

    const fetchData = async () => {
        try {
            const [reqRes, rolesRes] = await Promise.all([
                api.get("/admin/requests"),
                api.get("/roles"),
            ])
            setRequests(reqRes.data.data.requests || [])
            setAllRoles(rolesRes.data.data || [])
        } catch {
            toast.error("Failed to load access requests")
        } finally {
            setIsLoading(false)
            initialFetchDone.current = true
        }
    }

    useEffect(() => { fetchData() }, [])

    const filtered = statusFilter === "all"
        ? requests
        : requests.filter((r) => r.status === statusFilter)

    const pendingCount = requests.filter((r) => r.status === "pending").length

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
            await fetchData()
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
            await fetchData()
        } catch {
            toast.error("Failed to reject request")
        } finally {
            setRejecting(false)
        }
    }

    const statusBadge = (status: string) => {
        if (status === "pending") return <Badge variant="secondary" className="text-xs gap-1"><Clock className="h-3 w-3" />Pending</Badge>
        if (status === "approved") return <Badge className="text-xs gap-1 bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3" />Approved</Badge>
        return <Badge variant="destructive" className="text-xs gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Access Requests</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Review and manage user access requests
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {pendingCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                            {pendingCount} pending
                        </Badge>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                    { label: "Total", value: requests.length, icon: UserPlus, color: "text-primary", bg: "bg-primary/10" },
                    { label: "Pending", value: pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/20" },
                    { label: "Approved", value: requests.filter((r) => r.status === "approved").length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20" },
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

            {/* Filter */}
            <div className="flex items-center gap-2">
                {STATUS_FILTER_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setStatusFilter(opt.value)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            statusFilter === opt.value
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No requests found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((req) => (
                        <Card key={req.id} className="border shadow-none hover:border-primary/30 transition-all">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-sm">{req.name}</p>
                                            {statusBadge(req.status)}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{req.email}</p>
                                        {req.department && (
                                            <p className="text-xs text-muted-foreground">{req.department}</p>
                                        )}
                                        {req.reason && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">"{req.reason}"</p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1.5">
                                            Submitted {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground"
                                            title="View details"
                                            onClick={() => setDetailTarget(req)}
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                        {req.status === "pending" && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                                                    onClick={() => {
                                                        setApproveTarget(req)
                                                        setApproveForm({ role: "staff", password: "", note: "" })
                                                        setShowPassword(false)
                                                    }}
                                                >
                                                    <Check className="h-3 w-3" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs gap-1 text-destructive hover:text-destructive border-destructive/40 hover:bg-destructive/5"
                                                    onClick={() => { setRejectTarget(req); setRejectNote("") }}
                                                >
                                                    <X className="h-3 w-3" />
                                                    Reject
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

            {/* Approve Dialog */}
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
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {allRoles.map((r) => (
                                        <SelectItem key={r.name} value={r.name}>{r.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Initial Password <span className="text-destructive">*</span></Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Set password for this user"
                                    value={approveForm.password}
                                    onChange={(e) => setApproveForm((f) => ({ ...f, password: e.target.value }))}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                                        <div key={key} className={`flex items-center gap-1.5 text-xs ${pwValid[key as keyof typeof pwValid] ? "text-green-600" : "text-muted-foreground"}`}>
                                            <div className={`h-1.5 w-1.5 rounded-full ${pwValid[key as keyof typeof pwValid] ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Note (optional)</Label>
                            <Input
                                placeholder="Internal note about this approval"
                                value={approveForm.note}
                                onChange={(e) => setApproveForm((f) => ({ ...f, note: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveTarget(null)}>Cancel</Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleApprove}
                            disabled={approving || !isPwValid}
                        >
                            {approving ? "Approving..." : "Approve & Create Account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
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
                        <Input
                            placeholder="Reason for rejection"
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={rejecting}>
                            {rejecting ? "Rejecting..." : "Reject"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Request Details</DialogTitle>
                    </DialogHeader>
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
