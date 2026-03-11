"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, Mail, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"

import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/sonner"

// Fetch first app URL assigned to the logged-in user
async function getFirstAppUrl(token: string): Promise<string> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api"
        const res = await fetch(`${apiUrl}/user/apps`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        const apps: { base_url: string }[] = data.data || []
        if (apps.length > 0) return apps[0].base_url
    } catch { /* fallback below */ }
    return process.env.NEXT_PUBLIC_DEFAULT_APP_URL || "http://localhost:3001/dashboard"
}

const LoginContent = () => {
    const { login, externalLogin, isAuthenticated, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Check if we are processing a Google Login (derived state)
    const isGoogleCallback = !!searchParams.get("access_token")

    // Show toast if redirected due to session expiry
    useEffect(() => {
        if (sessionStorage.getItem("session_expired")) {
            sessionStorage.removeItem("session_expired")
            toast.error("Session expired", {
                description: "Please sign in again to continue",
            })
        }
    }, [])

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            const redirectUri = searchParams.get("redirect_uri")
            const token = localStorage.getItem("access_token") || ""
            if (redirectUri && token) {
                window.location.href = `${redirectUri}?access_token=${token}`
            } else {
                getFirstAppUrl(token).then((url) => {
                    window.location.href = url
                })
            }
        }
    }, [authLoading, isAuthenticated, router, searchParams])

    // Check for Google OAuth callback params
    useEffect(() => {
        const accessToken = searchParams.get("access_token")
        const error = searchParams.get("error")

        const handleAuth = async (token: string) => {
            try {
                await externalLogin(token)
                sessionStorage.setItem("login_toast", "true")
                const redirectUri = searchParams.get("redirect_uri")
                if (redirectUri) {
                    window.location.href = `${redirectUri}?access_token=${token}`
                } else {
                    const url = await getFirstAppUrl(token)
                    window.location.href = url
                }
            } catch {
                toast.error("Authentication failed", {
                    description: "Could not verify Google session"
                })
                router.replace("/login")
            }
        }

        if (accessToken) {
            handleAuth(accessToken)
        }

        if (error) {
            toast.error("Google Login Failed", {
                description: error === "google_auth_failed" ? "Authentication failed" : error,
            })
            // Clean URL
            router.replace("/login")
        }
    }, [router, externalLogin, searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const token = await login(email, password)
            toast.success("Login successful", {
                description: "Redirecting...",
            })

            const redirectUri = searchParams.get("redirect_uri")
            if (redirectUri) {
                window.location.href = `${redirectUri}?access_token=${token}`
            } else {
                const url = await getFirstAppUrl(token)
                window.location.href = url
            }
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { message?: string } } }
            toast.error("Login failed", {
                description: axiosError.response?.data?.message || "Please check your credentials and try again.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleGoogleLogin = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api"}/auth/google`
    }

    return (
        <div className="w-full h-screen flex flex-col lg:grid lg:grid-cols-2 overflow-hidden relative">
            <div className="absolute top-4 right-4 z-50">
                <ModeToggle className="text-white lg:text-foreground" />
            </div>
            {/* Left Side: Visual / Branding */}
            <div className="relative flex h-[35vh] lg:h-full w-full flex-col justify-between bg-zinc-900 text-white p-8 pt-12 lg:p-12 overflow-hidden shrink-0">
                {/* Abstract Background Effect */}
                <div className="absolute inset-0 bg-zinc-900">
                    <div className="absolute top-0 -left-1/4 w-full h-full bg-gradient-to-tr from-amber-500/20 to-yellow-600/20 rounded-full blur-3xl opacity-50 animate-in fade-in duration-1000" />
                    <div className="absolute bottom-0 -right-1/4 w-full h-full bg-gradient-to-tl from-yellow-500/20 to-orange-500/20 rounded-full blur-3xl opacity-50 animate-in fade-in duration-1000 delay-300" />
                </div>

                <div className="relative z-10 animate-in slide-in-from-top-8 duration-700 fade-in flex flex-col items-start space-y-4 lg:space-y-0">
                    <div className="flex items-center gap-3 text-lg font-bold">
                        <div className="w-12 h-12 lg:w-10 lg:h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/10 shadow-xl lg:shadow-none">
                            <Image
                                src="/kiansantang.png"
                                alt="Kiansantang Logo"
                                width={32}
                                height={32}
                                className="object-contain"
                            />
                        </div>
                        <span className="bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
                            KSM Cost Control
                        </span>
                    </div>
                </div>

                <div className="relative z-10 space-y-4 animate-in slide-in-from-bottom-8 duration-700 fade-in delay-200 mt-6 lg:mt-0 pb-2 lg:pb-0">
                    <blockquote className="space-y-4">
                        <p className="text-sm lg:text-xl font-medium leading-relaxed text-zinc-200 italic">
                            &quot;Excellence in construction management through precise cost control and efficient resource allocation.&quot;
                        </p>
                        <footer className="text-xs lg:text-sm text-amber-400 pt-2 flex items-center gap-2">
                            <div className="h-px w-8 bg-amber-500/50" />
                            Kiansantang Management System
                        </footer>
                    </blockquote>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950 -mt-6 lg:mt-0 rounded-t-[32px] lg:rounded-none relative z-20 shadow-2xl lg:shadow-none">
                <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px] animate-in slide-in-from-right-8 duration-700 fade-in ease-out">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            Welcome back
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your email to sign in to your account
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {/* Loading State Overlay */}
                        {(authLoading || isGoogleCallback) ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in duration-500">
                                <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                                <p className="text-muted-foreground text-sm">
                                    {isGoogleCallback ? "Completing secure sign-in..." : "Checking authentication..."}
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-5">
                                    <div className="grid gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-backwards">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400 transition-colors group-hover:text-amber-500 group-focus-within:text-amber-500" />
                                            <Input
                                                id="email"
                                                placeholder="name@example.com"
                                                type="email"
                                                autoCapitalize="none"
                                                autoComplete="email"
                                                autoCorrect="off"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={isSubmitting}
                                                className="pl-10 h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-amber-500 focus:ring-amber-500 transition-all group-hover:border-amber-500/50"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-backwards">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Password</Label>
                                        </div>
                                        <div className="relative group">
                                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-zinc-400 transition-colors group-hover:text-amber-500 group-focus-within:text-amber-500" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                disabled={isSubmitting}
                                                className="pl-10 pr-10 h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-amber-500 focus:ring-amber-500 transition-all group-hover:border-amber-500/50"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-3 h-5 w-5 text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-backwards pt-2">
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || !email || !password}
                                            className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] group font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Signing in...
                                                </>
                                            ) : (
                                                <>
                                                    Sign In
                                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </form>


                        )}

                        <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400 fill-mode-backwards">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-zinc-50 dark:bg-zinc-950 px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-backwards">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api"}/auth/google`}
                                disabled={isGoogleCallback || authLoading}
                            >
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                Sign in with Google
                            </Button>
                        </div>
                    </div >

                    <p className="px-8 text-center text-sm text-muted-foreground animate-in fade-in duration-700 delay-500">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/request-access"
                            className="underline underline-offset-4 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                        >
                            Request Access
                        </Link>
                    </p>
                </div >
            </div >
        </div >
    )
}

const LoginPage = () => {
    return (
        <Suspense fallback={
            <div className="w-full h-screen flex items-center justify-center bg-zinc-950">
                <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}

export default LoginPage
