"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    LayoutDashboard,
    Briefcase,
    FileCheck,
    PieChart,
    Database,
    LogOut,
    Menu
} from "lucide-react"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/sonner"

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    isCollapsed?: boolean
    onToggle?: () => void
}

import { MENU_ITEMS } from "@/lib/menu-list"

export function Sidebar({ className, isCollapsed = false, onToggle }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { logout } = useAuth()

    const handleLogout = async () => {
        await logout()
        toast.success("Logged out", { description: "You have been signed out successfully" })
        router.push("/login")
    }

    // routes replaced by imported MENU_ITEMS

    const SidebarItem = ({ route, isSubmenu = false }: { route: any, isSubmenu?: boolean }) => {
        // ... (unchanged code)
        const Icon = route.icon
        const isActive = pathname.startsWith(route.href)

        const content = (
            <Link
                href={route.href}
                className={cn(
                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-lg transition",
                    "hover:bg-muted",
                    isActive ? "bg-zinc-100 dark:bg-zinc-800 text-primary font-bold" : "text-muted-foreground",
                    isCollapsed && "justify-center p-2"
                )}
            >
                <div className={cn("flex items-center", isCollapsed ? "justify-center" : "flex-1")}>
                    {Icon && <Icon className={cn("h-5 w-5", route.color, !isCollapsed && "mr-3")} />}
                    {!isCollapsed && route.label}
                </div>
            </Link>
        )

        if (isCollapsed) {
            return (
                <div className="flex justify-center">
                    {/* If it has subroutes, use Dropdown */}
                    {route.subroutes ? (
                        <DropdownMenu>
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            {content}
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p>{route.label}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent side="right" align="start" className="min-w-[180px] ml-2">
                                <DropdownMenuLabel>{route.label}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {route.subroutes.map((sub: any) => (
                                    <DropdownMenuItem key={sub.href} asChild>
                                        <Link href={sub.href} className="cursor-pointer w-full">
                                            {sub.label}
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        // Standard Tooltip for single items
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    {content}
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>{route.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            )
        }

        return content
    }

    return (
        <>
            {/* Mobile Sidebar Content (unchanged) */}
            <div className={cn("relative flex flex-col h-full bg-background border-r border-sidebar-border md:hidden", className)}>
                {/* ... existing mobile code ... */}
                <div className="px-3 py-6 flex-1">
                    <Link href="/dashboard" className="flex items-center px-4 mb-14 justify-center">
                        <div className="relative w-40 h-10">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                fill
                                className="object-contain object-center"
                                priority
                            />
                        </div>
                    </Link>
                    <div className="space-y-1">
                        {MENU_ITEMS.map((route) => (
                            <div key={route.href}>
                                <SidebarItem route={route} />
                                {/* Mobile Submenu */}
                                {route.subroutes && pathname.startsWith(route.href) && (
                                    <div className="ml-12 mt-2 space-y-1 border-l-2 border-sidebar-border pl-2">
                                        {route.subroutes.map(sub => (
                                            <Link
                                                key={sub.href}
                                                href={sub.href}
                                                className={cn(
                                                    "block p-2 text-sm rounded-md transition",
                                                    "hover:text-primary dark:hover:text-primary",
                                                    pathname === sub.href ? "text-primary font-bold" : "text-muted-foreground"
                                                )}
                                            >
                                                {sub.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                {/* Desktop Logout (Bottom fixed) */}
                <div className="p-3 mt-auto border-t border-sidebar-border space-y-2">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-xs text-muted-foreground">Theme</span>
                        <ModeToggle />
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-zinc-500 dark:text-zinc-400 hover:text-foreground dark:hover:text-foreground hover:bg-muted dark:hover:bg-muted"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5 mr-3 text-red-500" />
                        Logout
                    </Button>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full w-full flex-col">
                <div className="h-full flex flex-col border-r bg-background text-sidebar-foreground">
                    {/* Header with Toggle */}
                    <div className={cn(
                        "h-16 flex items-center border-b border-sidebar-border relative",
                        isCollapsed ? "justify-center" : "justify-center"
                    )}>
                        <div className={cn("relative transition-all duration-300", isCollapsed ? "w-10 h-10" : "w-40 h-10")}>
                            <Image
                                src={isCollapsed ? "/kiansantang.png" : "/logo.png"} // Use icon for collapsed if available, else placeholder or scaled logo
                                alt="Logo"
                                fill
                                className="object-contain object-center"
                                priority
                            />
                        </div>
                        {/* Collapse Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background shadow-md z-20 hover:bg-muted text-muted-foreground"
                            onClick={onToggle}
                        >
                            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 py-6">
                        <nav className={cn("space-y-2", isCollapsed ? "px-2" : "px-4")}>
                            {MENU_ITEMS.map((route) => (
                                <div key={route.href}>
                                    <SidebarItem route={route} />

                                    {/* Submenus - Hide or Show based on collapse state */}
                                    {route.subroutes && pathname.startsWith(route.href) && !isCollapsed && (
                                        <div className="ml-10 mt-1 space-y-1 border-l-2 border-muted pl-3">
                                            {route.subroutes.map((sub) => (
                                                <Link
                                                    key={sub.href}
                                                    href={sub.href}
                                                    className={cn(
                                                        "block p-2 text-sm rounded-md transition",
                                                        "hover:text-primary dark:hover:text-primary",
                                                        pathname === sub.href ? "text-primary font-bold" : "text-muted-foreground"
                                                    )}
                                                >
                                                    {sub.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </ScrollArea>

                    {/* Desktop Footer */}
                    <div className="p-3 mt-auto border-t border-sidebar-border space-y-2 bg-background">
                        {!isCollapsed && (
                            <div className="flex items-center justify-between px-2">
                                <span className="text-xs text-muted-foreground">Theme</span>
                                <ModeToggle />
                            </div>
                        )}
                        {isCollapsed && (
                            <div className="flex justify-center pb-2">
                                <ModeToggle />
                            </div>
                        )}

                        {isCollapsed ? (
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-full justify-center text-zinc-500 hover:bg-muted"
                                            onClick={handleLogout}
                                        >
                                            <LogOut className="h-5 w-5 text-red-500" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Logout</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : (
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-zinc-500 dark:text-zinc-400 hover:text-foreground dark:hover:text-foreground hover:bg-muted dark:hover:bg-muted"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-5 w-5 mr-3 text-red-500" />
                                Logout
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export function MobileSidebar() {
    const [isMounted, setIsMounted] = useState(false)

    // Prevent hydration error by waiting for mount
    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return (
            <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
            </Button>
        )
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-background border-r border-sidebar-border w-72">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                    Navigation menu for mobile devices
                </SheetDescription>
                <Sidebar />
            </SheetContent>
        </Sheet>
    )
}
