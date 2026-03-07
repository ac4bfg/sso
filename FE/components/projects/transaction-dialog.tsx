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
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Transaction } from "./transaction-table" // Import from table definition
import { COST_ITEMS } from "@/lib/data" // Assuming we can use this for the dropdown

interface TransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: "add" | "edit"
    type: "RAP" | "REALIZATION" | "COST_TO_GO"
    initialData?: Transaction | null
    allowedItemCodes?: string[] // Optional: if provided, only these codes can be selected
    onSave: (data: Transaction) => void
}

export function TransactionDialog({
    open,
    onOpenChange,
    mode,
    type,
    initialData,
    allowedItemCodes,
    onSave
}: TransactionDialogProps) {
    const [formData, setFormData] = useState<Partial<Transaction>>({
        date: new Date().toISOString().split('T')[0],
        itemCode: "",
        description: "",
        qty: 1,
        unitPrice: 0,
        total: 0
    })

    useEffect(() => {
        if (open) {
            if (mode === "edit" && initialData) {
                setFormData(initialData)
            } else {
                setFormData({
                    id: Math.random().toString(36).substr(2, 9).toUpperCase(),
                    type: type, // Ensure type is set
                    projectId: "CURRENT_PROJECT", // Placeholder, will be overwritten by parent usually
                    date: new Date().toISOString().split('T')[0],
                    itemCode: "",
                    description: "",
                    qty: 1,
                    unitPrice: 0,
                    total: 0
                })
            }
        }
    }, [mode, initialData, open, type])

    // Auto-calculate total
    useEffect(() => {
        const qty = formData.qty || 0
        const price = formData.unitPrice || 0
        setFormData(prev => ({ ...prev, total: qty * price }))
    }, [formData.qty, formData.unitPrice])


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData as Transaction)
        onOpenChange(false)
    }

    // Flatten cost items for select (simple approach for now)
    // In a real app complexity, you might want a Combobox or tree select
    const flattenItems = (items: any[]) => {
        let flat: any[] = []
        items.forEach(item => {
            flat.push(item)
            if (item.children) {
                flat = [...flat, ...flattenItems(item.children)]
            }
        })
        return flat
    }
    const allCostItems = flattenItems(COST_ITEMS)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Removed z-index manual override to use global default */}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{mode === "add" ? "Add Transaction" : "Edit Transaction"}</DialogTitle>
                    <DialogDescription>
                        {mode === "add" ? `Create a new ${type} entry.` : `Update ${type} entry details.`}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="itemCode" className="text-right">Cost Item</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "col-span-3 justify-between",
                                        !formData.itemCode && "text-muted-foreground"
                                    )}
                                >
                                    {formData.itemCode
                                        ? allCostItems.find(
                                            (item) => item.code === formData.itemCode
                                        )?.name
                                        : "Select Cost Item"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[350px] p-0 z-[205]" align="start">
                                <Command>
                                    <CommandInput placeholder="Search cost item..." />
                                    <CommandList>
                                        <CommandEmpty>No cost item found.</CommandEmpty>
                                        <CommandGroup>
                                            {allCostItems
                                                .filter(item => !allowedItemCodes || allowedItemCodes.includes(item.code))
                                                .map(item => (
                                                    <CommandItem
                                                        value={item.name}
                                                        key={item.code}
                                                        onSelect={() => {
                                                            setFormData({ ...formData, itemCode: item.code })
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                item.code === formData.itemCode
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {item.code} - {item.name}
                                                    </CommandItem>
                                                ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Description</Label>
                        <Input
                            id="description"
                            value={formData.description || ""}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="col-span-3"
                            placeholder="Optional details..."
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="qty" className="text-right">Qty</Label>
                        <Input
                            id="qty"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.qty}
                            onChange={(e) => setFormData({ ...formData, qty: parseFloat(e.target.value) })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unitPrice" className="text-right">Unit Price</Label>
                        <Input
                            id="unitPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.unitPrice}
                            onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="total" className="text-right">Total</Label>
                        <Input
                            id="total"
                            type="number"
                            value={formData.total}
                            disabled
                            className="col-span-3 bg-muted font-bold"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit">
                            {mode === "add" ? "Save" : "Update"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
