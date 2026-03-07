import {
    LayoutDashboard,
    Briefcase,
    FileCheck,
    PieChart,
    Database,
} from "lucide-react"

export const MENU_ITEMS = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-primary",
    },
    {
        label: "Projects",
        icon: Briefcase,
        href: "/projects",
        color: "text-primary",
    },
    // Removed Approval Center
    {
        label: "Reports",
        icon: PieChart,
        href: "/reports",
        color: "text-primary",
    },
    {
        label: "Master Data",
        icon: Database,
        href: "/master",
        color: "text-primary",
        subroutes: [
            { label: "Cost Standards", href: "/master/items" },
            { label: "Stakeholders", href: "/master/stakeholders" },
            { label: "References", href: "/master/references" },
        ]
    },
]
