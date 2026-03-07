"use client"

import * as React from "react"
import {
    Settings,
    User,
    ChevronRight
} from "lucide-react"

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { MENU_ITEMS } from "@/lib/menu-list"

interface SearchCommandProps {
    className?: string
}

export function SearchCommand({ className }: SearchCommandProps) {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)

    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        setIsMounted(true)
        // ... (existing keydown logic)
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                const input = document.querySelector('[cmdk-input]') as HTMLElement
                if (input) {
                    input.focus()
                    setOpen(true)
                }
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[cmdk-root]')) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])


    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    if (!isMounted) return null

    return (
        <div className={cn("relative w-full max-w-[400px]", className)}>
            <Command className="rounded-lg border shadow-sm overflow-visible bg-muted/50">
                <CommandInput
                    placeholder="Search or type a command..."
                    onFocus={() => setOpen(true)}
                // We don't have direct onBlur close because clicking an item triggers blur first.
                />

                <div className={cn(
                    "absolute top-full left-0 w-full z-50 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
                    !open && "hidden"
                )}>
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup heading="Suggestions">
                            {MENU_ITEMS.map((item) => {
                                // If item has no subroutes, render it directly
                                if (!item.subroutes) {
                                    const Icon = item.icon
                                    return (
                                        <CommandItem
                                            key={item.href}
                                            value={item.label}
                                            onSelect={() => runCommand(() => router.push(item.href))}
                                        >
                                            {Icon && <Icon className="mr-2 h-4 w-4" />}
                                            <span>{item.label}</span>
                                        </CommandItem>
                                    )
                                }
                                return null
                            })}
                        </CommandGroup>

                        {/* Render items with subroutes as separate groups or sections */}
                        {MENU_ITEMS.map((item) => {
                            if (item.subroutes) {
                                return (
                                    <React.Fragment key={item.label}>
                                        <CommandSeparator />
                                        <CommandGroup heading={item.label}>
                                            {item.subroutes.map((sub) => (
                                                <CommandItem
                                                    key={sub.href}
                                                    value={sub.label}
                                                    onSelect={() => runCommand(() => router.push(sub.href))}
                                                >
                                                    {/* Use generic icon for subitems or add specific ones to menu-list if needed */}
                                                    <ChevronRight className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    <span>{sub.label}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </React.Fragment>
                                )
                            }
                            return null
                        })}

                        <CommandSeparator />
                        <CommandGroup heading="Settings">
                            <CommandItem value="Profile" onSelect={() => runCommand(() => console.log("Profile clicked"))}>
                                <User className="mr-2 h-4 w-4" />
                                <span className="mr-2">Profile</span> {/* Added mr-2 for spacing if command shortcut removed, or just keep as is */}
                            </CommandItem>
                            <CommandItem value="Settings" onSelect={() => runCommand(() => console.log("Settings clicked"))}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </div>
            </Command>
        </div>
    )
}
