import type { LucideIcon } from "lucide-react"
import {
    LayoutDashboard,
    Users,
    AppWindow,
    ShieldCheck,
    Activity,
} from "lucide-react"

export interface MenuItem {
    label: string
    icon: LucideIcon
    href: string
    color: string
    subroutes?: { label: string; href: string }[]
}

export const MENU_ITEMS: MenuItem[] = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-primary",
    },
    {
        label: "Users",
        icon: Users,
        href: "/admin/users",
        color: "text-primary",
    },
    {
        label: "Applications",
        icon: AppWindow,
        href: "/admin/apps",
        color: "text-primary",
    },
    {
        label: "Roles",
        icon: ShieldCheck,
        href: "/admin/roles",
        color: "text-primary",
    },
    {
        label: "Activity Logs",
        icon: Activity,
        href: "/admin/logs",
        color: "text-primary",
    },
]
