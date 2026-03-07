"use client"

import { Toaster as Sonner, toast as sonnerToast } from "sonner"
import { useTheme } from "next-themes"
import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react"
import { createElement } from "react"

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster({ ...props }: ToasterProps) {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            position="top-right"
            expand
            closeButton
            duration={4000}
            toastOptions={{
                classNames: {
                    toast: "font-sans shadow-lg",
                },
            }}
            {...props}
        />
    )
}

// Custom toast with colored left border + colored icon
const toast = {
    success: (message: string, opts?: { description?: string }) =>
        sonnerToast(message, {
            ...opts,
            icon: createElement(CircleCheck, { className: "h-5 w-5", style: { color: "#10b981" } }),
            style: { borderLeft: "3px solid #10b981" },
        }),
    error: (message: string, opts?: { description?: string }) =>
        sonnerToast(message, {
            ...opts,
            icon: createElement(CircleX, { className: "h-5 w-5", style: { color: "#ef4444" } }),
            style: { borderLeft: "3px solid #ef4444" },
        }),
    info: (message: string, opts?: { description?: string }) =>
        sonnerToast(message, {
            ...opts,
            icon: createElement(Info, { className: "h-5 w-5", style: { color: "#3b82f6" } }),
            style: { borderLeft: "3px solid #3b82f6" },
        }),
    warning: (message: string, opts?: { description?: string }) =>
        sonnerToast(message, {
            ...opts,
            icon: createElement(TriangleAlert, { className: "h-5 w-5", style: { color: "#f59e0b" } }),
            style: { borderLeft: "3px solid #f59e0b" },
        }),
}

export { Toaster, toast }
