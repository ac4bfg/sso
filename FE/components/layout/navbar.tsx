"use client"

import { useState, useEffect } from "react"

import { MobileSidebar } from "@/components/layout/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell } from "lucide-react"

import { SearchCommand } from "@/components/layout/search-command"
import { NotificationSidebar } from "@/components/layout/notification-sidebar"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/sonner"

export function Navbar() {
    const router = useRouter()
    const { user, logout } = useAuth()
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return null
    }

    // Get initials for avatar fallback
    const initials = user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?"

    return (
        <div className="flex items-center p-4 border-b h-16 bg-background shadow-sm">
            <MobileSidebar />

            {/* Search Input */}
            <div className="hidden md:flex items-center ml-4 flex-1 max-w-xl">
                <SearchCommand className="w-full" />
            </div>

            <div className="ml-auto flex items-center gap-x-4">
                <NotificationSidebar />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-x-2 cursor-pointer hover:opacity-80 transition">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    {user?.name || "User"}
                                </p>
                                <p className="text-xs text-slate-500 capitalize">
                                    {user?.role || "—"}
                                </p>
                            </div>
                            <Avatar>
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/profile")}>
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500 cursor-pointer" onClick={async () => { await logout(); toast.success("Logged out", { description: "You have been signed out successfully" }); router.push("/login") }}>
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
