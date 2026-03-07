"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { useEffect, useState } from "react"
import { CostItem } from "@/lib/data"

const COMMON_UNITS = [
    "m", "m2", "m3", "kg", "ton", "ltr", "btg", "lbr", "sak", "rol",
    "unit", "set", "ls", "titik", "jam", "hari", "bulan", "mandays"
]

interface CostItemDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: "add" | "edit"
    initialData?: CostItem | null
    parents: CostItem[]
}

// Helper to flatten tree for select dropdown
function flattenTree(items: CostItem[], depth = 0): { id: string; label: string; depth: number; text: string }[] {
    return items.reduce((acc, item) => {
        acc.push({
            id: item.id,
            label: item.code + " - " + item.name,
            depth,
            text: `${item.code} ${item.name}` // for searching
        })
        if (item.children) {
            acc.push(...flattenTree(item.children, depth + 1))
        }
        return acc
    }, [] as { id: string; label: string; depth: number, text: string }[])
}

// Helper to find a node and its children in the tree
function findNodeAndChildren(nodes: CostItem[], targetId: string): { node: CostItem | null, children: CostItem[] } {
    if (targetId === "root") return { node: null, children: nodes }

    for (const node of nodes) {
        if (node.id === targetId) {
            return { node, children: node.children || [] }
        }
        if (node.children) {
            const found = findNodeAndChildren(node.children, targetId)
            if (found.node) return found
        }
    }
    return { node: null, children: [] }
}

// Logic to generate next code
function generateNextCode(parentId: string, roots: CostItem[]): string {
    const { node: parentNode, children } = findNodeAndChildren(roots, parentId)

    // Strategy 1: If there are existing children, continue the pattern
    if (children.length > 0) {
        const lastChildCode = children[children.length - 1].code

        // Try to identify number at the end
        const match = lastChildCode.match(/(\d+)$/)
        if (match) {
            const numberPart = match[1]
            const prefix = lastChildCode.substring(0, match.index)
            const nextNumber = parseInt(numberPart) + 1
            // Pad with same length of zeros
            return prefix + nextNumber.toString().padStart(numberPart.length, '0')
        }
    }

    // Strategy 2: New Child for existing Parent
    if (parentNode) {
        // Parent Code: 5000 -> Child: 5100 (Increment hundreds?)
        // Parent Code: 5100 -> Child: 5110.001 (Append sub-decimal?)

        const pCode = parentNode.code
        if (pCode.endsWith("000")) {
            // 5000 -> 5100
            const prefix = pCode.substring(0, 1)
            const suffix = parseInt(pCode.substring(1)) + 100
            return prefix + suffix
        } else if (pCode.indexOf('.') === -1) {
            // 5100 -> 5100.001
            return pCode + ".001"
        } else {
            // 5100.001 -> 5100.001.01 (Rare, but deeper nesting)
            return pCode + ".01"
        }
    }

    // Strategy 3: New Root
    // Find max root code
    if (parentId === "root" && roots.length > 0) {
        const rootCodes = roots.map(r => parseInt(r.code)).filter(n => !isNaN(n))
        if (rootCodes.length > 0) {
            const max = Math.max(...rootCodes)
            return (Math.ceil((max + 1) / 1000) * 1000).toString() // Round up or just +1000
        }
        return "1000"
    }

    return ""
}

export function CostItemDialog({
    open,
    onOpenChange,
    mode,
    initialData,
    parents
}: CostItemDialogProps) {
    // Flatten parents for the dropdown
    const [flattenedParents, setFlattenedParents] = useState<{ id: string; label: string; depth: number; text: string }[]>([])

    // Combobox states
    const [openParent, setOpenParent] = useState(false)
    const [openUnit, setOpenUnit] = useState(false)

    useEffect(() => {
        setFlattenedParents(flattenTree(parents))
    }, [parents])

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        unit: "",
        parentId: "root"
    })

    // Auto-suggest code when Parent changes (only if adding new item)
    useEffect(() => {
        if (mode === "add" && open) {
            const suggested = generateNextCode(formData.parentId, parents)
            if (suggested) {
                // Only verify if we should overwrite? 
                // For now, let's overwrite only if current code is empty OR looks like an auto-generated one from a previous parent selection
                // But simpler: Just set it if it's empty, user can edit. 
                // Better UX: Always suggest, user sees it update. If they typed something manually, maybe don't?
                // Let's stick to: If Empty or if it was just changed by us logic (track dirty state?)
                // For mvp: Set it.
                setFormData(prev => ({ ...prev, code: suggested }))
            }
        }
    }, [formData.parentId, parents, mode, open])

    // Reset or Load Data when Dialog opens
    useEffect(() => {
        if (mode === "edit" && initialData) {
            setFormData({
                code: initialData.code,
                name: initialData.name,
                unit: initialData.unit || "",
                parentId: "root" // In real app, we would find the parent ID
            })
        } else if (mode === "add" && open) {
            // Reset for Add mode
            setFormData({
                code: "", // Will be filled by the parentId effect immediately
                name: "",
                unit: "",
                parentId: "root"
            })
        }
    }, [mode, initialData, open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Here you would call an API/Server Action
        console.log("Submitting:", formData)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{mode === "add" ? "Add Cost Item" : "Edit Cost Item"}</DialogTitle>
                    <DialogDescription>
                        {mode === "add"
                            ? "Create a new cost component or category."
                            : "Update existing cost item details and hierarchy."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="code" className="text-right">Code</Label>
                        <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="col-span-3"
                            placeholder="Auto-generated or type manually"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                            placeholder="e.g. Concrete Works"
                        />
                    </div>

                    {/* Parent Selector (Searchable Combobox) */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="parent" className="text-right">Parent</Label>
                        <Popover open={openParent} onOpenChange={setOpenParent}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openParent}
                                    className="col-span-3 justify-between font-normal"
                                >
                                    {formData.parentId === "root"
                                        ? "None (Top Level)"
                                        : flattenedParents.find((p) => p.id === formData.parentId)?.label || "Select Parent..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[340px] p-0 z-[205]" align="start">
                                <Command>
                                    <CommandInput placeholder="Search parent category..." />
                                    <CommandList>
                                        <CommandEmpty>No parent found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="root"
                                                onSelect={() => {
                                                    setFormData({ ...formData, parentId: "root" })
                                                    setOpenParent(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        formData.parentId === "root" ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                None (Top Level)
                                            </CommandItem>
                                            {flattenedParents.map((parent) => (
                                                <CommandItem
                                                    key={parent.id}
                                                    value={parent.text} // Search by code & name combined
                                                    onSelect={() => {
                                                        setFormData({ ...formData, parentId: parent.id })
                                                        setOpenParent(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            formData.parentId === parent.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <span style={{ paddingLeft: `${parent.depth * 10}px` }}>
                                                        {parent.depth > 0 && "↳ "} {parent.label}
                                                    </span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Unit Selector (Searchable Combobox) */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unit" className="text-right">Unit</Label>
                        <Popover open={openUnit} onOpenChange={setOpenUnit}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openUnit}
                                    className="col-span-3 justify-between font-normal"
                                >
                                    {formData.unit ? formData.unit : "Select Unit..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[340px] p-0 z-[205]" align="start">
                                <Command>
                                    <CommandInput placeholder="Search unit..." />
                                    <CommandList>
                                        <CommandEmpty>No unit found.</CommandEmpty>
                                        <CommandGroup>
                                            {COMMON_UNITS.map((unit) => (
                                                <CommandItem
                                                    key={unit}
                                                    value={unit}
                                                    onSelect={(currentValue) => {
                                                        setFormData({ ...formData, unit: currentValue })
                                                        setOpenUnit(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            formData.unit === unit ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {unit}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <DialogFooter>
                        <Button type="submit">
                            {mode === "add" ? "Create Item" : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
