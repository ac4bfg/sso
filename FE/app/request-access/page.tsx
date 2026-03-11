"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, Check, Loader2, Clock, XCircle, UserCheck } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ModeToggle } from "@/components/mode-toggle"
import { toast } from "@/components/ui/sonner"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api"

export default function RequestAccessPage() {
    const [form, setForm] = useState({ name: "", email: "", department: "", reason: "" })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [emailPending, setEmailPending] = useState(false)
    const [pendingCreatedAt, setPendingCreatedAt] = useState<string | null>(null)
    const [emailRejected, setEmailRejected] = useState(false)
    const [rejectedNote, setRejectedNote] = useState<string | null>(null)
    const [emailRegistered, setEmailRegistered] = useState(false)

    const resetEmailState = () => {
        setEmailPending(false)
        setPendingCreatedAt(null)
        setEmailRejected(false)
        setRejectedNote(null)
        setEmailRegistered(false)
    }

    const checkEmail = async (email: string) => {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
        try {
            const res = await fetch(`${API_BASE}/access-requests/check?email=${encodeURIComponent(email)}`)
            const data = await res.json()
            if (data.data?.registered) {
                setEmailRegistered(true)
                setEmailPending(false)
                setPendingCreatedAt(null)
                setEmailRejected(false)
                setRejectedNote(null)
            } else if (data.data?.pending) {
                setEmailPending(true)
                setPendingCreatedAt(data.data.created_at || null)
                setEmailRejected(false)
                setRejectedNote(null)
                setEmailRegistered(false)
            } else if (data.data?.rejected) {
                setEmailRejected(true)
                setRejectedNote(data.data.review_note || null)
                setEmailPending(false)
                setPendingCreatedAt(null)
                setEmailRegistered(false)
            } else {
                resetEmailState()
            }
        } catch {
            // silently fail
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name || !form.email) return
        setIsSubmitting(true)
        try {
            const res = await fetch(`${API_BASE}/access-requests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || "Failed to submit")
            setSubmitted(true)
        } catch (err: unknown) {
            const e = err as Error
            toast.error("Failed to submit request", { description: e.message })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="w-full h-screen flex flex-col lg:grid lg:grid-cols-2 overflow-hidden relative">
            <div className="absolute top-4 right-4 z-50">
                <ModeToggle className="text-white lg:text-foreground" />
            </div>

            {/* Left Side */}
            <div className="relative flex h-[35vh] lg:h-full w-full flex-col justify-between bg-zinc-900 text-white p-8 pt-12 lg:p-12 overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-zinc-900">
                    <div className="absolute top-0 -left-1/4 w-full h-full bg-linear-to-tr from-amber-500/20 to-yellow-600/20 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-0 -right-1/4 w-full h-full bg-linear-to-tl from-yellow-500/20 to-orange-500/20 rounded-full blur-3xl opacity-50" />
                </div>
                <div className="relative z-10 flex items-center gap-3 text-lg font-bold">
                    <div className="w-12 h-12 lg:w-10 lg:h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/10">
                        <Image src="/kiansantang.png" alt="Logo" width={32} height={32} className="object-contain" />
                    </div>
                    <span className="bg-linear-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
                        KSM Cost Control
                    </span>
                </div>
                <div className="relative z-10 space-y-4 animate-in slide-in-from-bottom-8 duration-700 fade-in delay-200 mt-6 lg:mt-0 pb-2 lg:pb-0">
                    <blockquote className="space-y-4">
                        <p className="text-sm lg:text-xl font-medium leading-relaxed text-zinc-200 italic">
                            &quot;Submit your access request and our admin team will review it promptly.&quot;
                        </p>
                        <footer className="text-xs lg:text-sm text-amber-400 pt-2 flex items-center gap-2">
                            <div className="h-px w-8 bg-amber-500/50" />
                            Kiansantang Management System
                        </footer>
                    </blockquote>
                </div>
            </div>

            {/* Right Side */}
            <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950 -mt-6 lg:mt-0 rounded-t-4xl lg:rounded-none relative z-20 shadow-2xl lg:shadow-none">
                <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-100 animate-in slide-in-from-right-8 duration-700 fade-in ease-out">

                    {submitted ? (
                        /* ── Success State ── */
                        <div className="flex flex-col items-center text-center space-y-6 py-8 animate-in fade-in zoom-in-95 duration-500">
                            <div className="relative flex items-center justify-center">
                                <span className="absolute inline-flex h-24 w-24 rounded-full bg-amber-400/20 animate-ping" style={{ animationDuration: "1.8s" }} />
                                <span className="absolute inline-flex h-20 w-20 rounded-full bg-amber-400/15" />
                                <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-linear-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 animate-in zoom-in-75 duration-500 delay-100">
                                    <Check className="h-8 w-8 text-white stroke-[2.5]" />
                                </div>
                            </div>

                            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Request Submitted!</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Your access request has been sent to the admin team.<br />
                                    You will be contacted once it has been reviewed.
                                </p>
                            </div>

                            <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300">
                                <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 p-4 text-left space-y-2">
                                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">Request Summary</p>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Name</span>
                                            <span className="font-medium">{form.name}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Email</span>
                                            <span className="font-medium">{form.email}</span>
                                        </div>
                                        {form.department && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Department</span>
                                                <span className="font-medium">{form.department}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Link href="/login" className="block">
                                    <Button variant="outline" className="w-full gap-2 h-11">
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Sign In
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        /* ── Form State ── */
                        <div className="relative">
                            {/* Loading overlay */}
                            {isSubmitting && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                                    <div className="relative flex items-center justify-center">
                                        <span className="absolute h-14 w-14 rounded-full bg-amber-400/20 animate-ping" style={{ animationDuration: "1.2s" }} />
                                        <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-linear-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/30">
                                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Submitting your request...</p>
                                </div>
                            )}

                            <div className={`space-y-6 transition-opacity duration-200 ${isSubmitting ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
                                <div className="flex flex-col space-y-2">
                                    <Link href="/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                        Back to Sign In
                                    </Link>
                                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-2">
                                        Request Access
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        Fill in your details and we&apos;ll get you set up
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            value={form.name}
                                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                            disabled={isSubmitting}
                                            className="h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-amber-500 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email">Work Email <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@company.com"
                                            value={form.email}
                                            onChange={(e) => {
                                                setForm((f) => ({ ...f, email: e.target.value }))
                                                if (emailPending || emailRejected || emailRegistered) resetEmailState()
                                            }}
                                            onBlur={(e) => checkEmail(e.target.value)}
                                            disabled={isSubmitting}
                                            className={`h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-amber-500 focus:ring-amber-500 ${emailPending ? "border-amber-400 dark:border-amber-600" : emailRejected ? "border-red-300 dark:border-red-800/60" : emailRegistered ? "border-blue-300 dark:border-blue-800/60" : ""}`}
                                        />
                                        {emailRegistered && (
                                            <div className="flex items-start gap-2 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/20 px-3 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Account already exists</p>
                                                    <p className="text-xs text-blue-600/80 dark:text-blue-500/80">
                                                        This email is already registered.{" "}
                                                        <Link href="/login" className="underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300">Sign in instead</Link>.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {emailPending && (
                                            <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Request already pending</p>
                                                    <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
                                                        A request with this email is already under review.{pendingCreatedAt ? ` Submitted ${new Date(pendingCreatedAt).toLocaleDateString()}.` : ""} Please wait for admin approval.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {emailRejected && (
                                            <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 px-3 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-medium text-red-700 dark:text-red-400">Previous request was rejected</p>
                                                    {rejectedNote ? (
                                                        <p className="text-xs text-red-600/80 dark:text-red-500/80">
                                                            Reason: {rejectedNote}. You may submit a new request below.
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-red-600/80 dark:text-red-500/80">
                                                            No reason was provided. You may submit a new request below.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="department">Department</Label>
                                        <Input
                                            id="department"
                                            placeholder="e.g. Finance, Operations"
                                            value={form.department}
                                            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                                            disabled={isSubmitting}
                                            className="h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-amber-500 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="reason">Reason for Access</Label>
                                        <Textarea
                                            id="reason"
                                            placeholder="Briefly describe why you need access..."
                                            value={form.reason}
                                            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                                            disabled={isSubmitting}
                                            rows={3}
                                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 resize-none focus:border-amber-500 focus:ring-amber-500"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || !form.name || !form.email || emailPending || emailRegistered}
                                        className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] group font-medium disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        {emailRejected ? "Resubmit Request" : "Submit Request"}
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
