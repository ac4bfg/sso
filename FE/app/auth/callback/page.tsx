"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

const CallbackContent = () => {
    const searchParams = useSearchParams()

    useEffect(() => {
        const code = searchParams.get("code")
        const redirectUri = searchParams.get("redirect_uri")

        if (!code) {
            const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL || "http://localhost:3001"
            window.location.href = `${ssoUrl}/login?error=missing_code`
            return
        }

        const exchange = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api"
                const res = await fetch(`${apiUrl}/auth/exchange`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                })

                if (!res.ok) throw new Error("Exchange failed")

                const data = await res.json()
                const accessToken = data.data?.access_token
                if (!accessToken) throw new Error("No token in response")

                localStorage.setItem("access_token", accessToken)
                sessionStorage.setItem("login_toast", "true")

                if (redirectUri) {
                    window.location.href = `${redirectUri}?access_token=${accessToken}`
                } else {
                    const defaultApp = process.env.NEXT_PUBLIC_DEFAULT_APP_URL || "http://localhost:3000"
                    window.location.href = `${defaultApp}?access_token=${accessToken}`
                }
            } catch {
                const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL || "http://localhost:3001"
                window.location.href = `${ssoUrl}/login?error=google_auth_failed`
            }
        }

        exchange()
    }, [searchParams])

    return (
        <div className="w-full h-screen flex items-center justify-center bg-zinc-950">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                <p className="text-zinc-400 text-sm">Completing sign-in...</p>
            </div>
        </div>
    )
}

const AuthCallbackPage = () => {
    return (
        <Suspense fallback={
            <div className="w-full h-screen flex items-center justify-center bg-zinc-950">
                <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            </div>
        }>
            <CallbackContent />
        </Suspense>
    )
}

export default AuthCallbackPage
