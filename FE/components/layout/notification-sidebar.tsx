"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Trash2, X, AlertCircle, AlertTriangle, Info, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Mock Data
type Notification = {
    id: number
    title: string
    description: string
    time: string
    type: "critical" | "warning" | "info" | "success"
    read: boolean
}

const INITIAL_NOTIFICATIONS: Notification[] = [
    {
        id: 1,
        title: "Critical Budget Alert",
        description: "Project 'KSM-24P047' has reached 95% of its budget limit.",
        time: "10 min ago",
        type: "critical",
        read: false,
    },
    {
        id: 2,
        title: "Material Usage Warning",
        description: "Usage of 'Pipa Schedule 40' exceeds planned RAP by 15%.",
        time: "2 hours ago",
        type: "warning",
        read: false,
    },
    {
        id: 3,
        title: "New Addendum Added",
        description: "Addendum valued at Rp 150,000,000 added to 'KSM-24P047'.",
        time: "1 day ago",
        type: "info",
        read: true,
    },
    {
        id: 4,
        title: "Project Completed",
        description: "Project 'KSM-23P001' marked as Completed.",
        time: "2 days ago",
        type: "success",
        read: true,
    },
]

export function NotificationSidebar() {
    const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS)
    const [isOpen, setIsOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const unreadCount = notifications.filter((n) => !n.read).length

    if (!isMounted) {
        return null
    }

    const markAsRead = (id: number) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ))
    }

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
    }

    const deleteNotification = (id: number) => {
        setNotifications(notifications.filter(n => n.id !== id))
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative cursor-pointer hover:bg-muted">
                    <Bell className="h-5 w-5 text-muted-foreground hover:text-primary transition" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-background animate-pulse" />
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
                <SheetHeader className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <SheetTitle className="text-xl">Notifications</SheetTitle>
                            <SheetDescription>
                                You have {unreadCount} unread messages.
                            </SheetDescription>
                        </div>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                                <Check className="mr-2 h-3 w-3" />
                                Mark all read
                            </Button>
                        )}
                    </div>
                </SheetHeader>
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                        {notifications.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No notifications yet.</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "relative group flex gap-4 p-4 rounded-lg border transition-all hover:bg-muted/50",
                                        !notification.read ? "bg-muted/30 border-l-4" : "bg-background",
                                        !notification.read && notification.type === "critical" ? "border-l-red-500" :
                                            !notification.read && notification.type === "warning" ? "border-l-yellow-500" :
                                                !notification.read && notification.type === "success" ? "border-l-green-500" :
                                                    !notification.read ? "border-l-blue-500" : ""
                                    )}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className="mt-1">
                                        {notification.type === "critical" && <AlertCircle className="h-5 w-5 text-red-500" />}
                                        {notification.type === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                                        {notification.type === "info" && <Info className="h-5 w-5 text-blue-500" />}
                                        {notification.type === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                    </div>
                                    <div className="flex-1 space-y-1 cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <p className={cn("text-sm font-medium leading-none", !notification.read && "font-bold")}>
                                                {notification.title}
                                            </p>
                                            <span className="text-xs text-muted-foreground">{notification.time}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {notification.description}
                                        </p>
                                    </div>
                                    {/* Action Buttons (Visible on Hover) */}
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background/80 backdrop-blur-sm rounded-md p-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                deleteNotification(notification.id)
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    {/* Unread Indicator */}
                                    {!notification.read && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
