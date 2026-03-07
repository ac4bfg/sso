"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import api from "@/lib/api"

interface User {
    id: string
    name: string
    email: string
    role: string
    is_active: boolean
    is_password_set: boolean // New field
    last_login_at: string | null
    created_at: string
}

interface AuthContextType {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<string>
    externalLogin: (token: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const pathname = usePathname()

    // Check auth on mount
    useEffect(() => {
        const initAuth = async () => {
            // Check for token in URL (from Google Login redirect to Dashboard)
            if (typeof window !== "undefined") {
                const params = new URLSearchParams(window.location.search)
                const urlToken = params.get("access_token")
                if (urlToken) {
                    localStorage.setItem("access_token", urlToken)
                    sessionStorage.setItem("login_toast", "true")
                    // Clean URL
                    window.history.replaceState({}, "", window.location.pathname)
                }
            }

            const token = localStorage.getItem("access_token")
            if (!token) {
                setIsLoading(false)
                return
            }

            try {
                const res = await api.get("/auth/me")
                setUser(res.data.data)
            } catch {
                // Token invalid — clear
                localStorage.removeItem("access_token")
                localStorage.removeItem("user")
            } finally {
                setIsLoading(false)
            }
        }

        initAuth()
    }, [])

    // Check session on route change
    useEffect(() => {
        if (!user) return

        const checkSession = async () => {
            try {
                await api.head("/auth/check")
            } catch (error) {
                console.error("Session check failed on navigation", error)
            }
        }

        checkSession()
    }, [pathname, user])

    const login = useCallback(async (email: string, password: string) => {
        const res = await api.post("/auth/login", { email, password })
        const { access_token, user: userData } = res.data.data

        localStorage.setItem("access_token", access_token)
        localStorage.setItem("user", JSON.stringify(userData))

        setUser(userData)
        return access_token;
    }, [])

    const logout = useCallback(async () => {
        try {
            // Cookie is sent automatically — no body needed
            await api.post("/auth/logout")
        } catch {
            // Ignore logout API errors
        } finally {
            localStorage.removeItem("access_token")
            localStorage.removeItem("user")
            setUser(null)
        }
    }, [])

    const externalLogin = useCallback(async (token: string) => {
        localStorage.setItem("access_token", token)
        try {
            const res = await api.get("/auth/me")
            setUser(res.data.data)
        } catch (error) {
            localStorage.removeItem("access_token")
            setUser(null)
            throw error
        }
    }, [])

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                externalLogin,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
