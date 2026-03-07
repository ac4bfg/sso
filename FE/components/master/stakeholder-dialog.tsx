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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react"

export interface Stakeholder {
    id: string
    name: string
    type: string // "Client" | "Vendor" | "Subcon" etc
    contact: string
    email: string
    rating?: string // Optional for vendors
}

interface StakeholderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: "add" | "edit"
    initialData?: Stakeholder | null
    defaultType?: string // "Client" or "Vendor" to pre-select
    onSave: (data: Stakeholder) => void
}

export function StakeholderDialog({
    open,
    onOpenChange,
    mode,
    initialData,
    defaultType,
    onSave
}: StakeholderDialogProps) {
    const [formData, setFormData] = useState<Stakeholder>({
        id: "",
        name: "",
        type: defaultType || "Client",
        contact: "",
        email: "",
        rating: "B"
    })

    useEffect(() => {
        if (mode === "edit" && initialData) {
            setFormData(initialData)
        } else {
            setFormData({
                id: Math.random().toString(36).substr(2, 9), // Mock ID
                name: "",
                type: defaultType || "Client",
                contact: "",
                email: "",
                rating: "B"
            })
        }
    }, [mode, initialData, open, defaultType])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{mode === "add" ? "Add Stakeholder" : "Edit Stakeholder"}</DialogTitle>
                    <DialogDescription>
                        {mode === "add" ? "Register a new external party." : "Update stakeholder details."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                            placeholder="e.g. PT Maju Mundur"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val) => setFormData({ ...formData, type: val })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent className="z-[205]">
                                <SelectItem value="Client">Client / Owner</SelectItem>
                                <SelectItem value="Developer">Developer</SelectItem>
                                <SelectItem value="Government">Government</SelectItem>
                                <SelectItem value="Vendor">Vendor / Supplier</SelectItem>
                                <SelectItem value="Subcon">Subcontractor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contact" className="text-right">Contact</Label>
                        <Input
                            id="contact"
                            value={formData.contact}
                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                            className="col-span-3"
                            placeholder="PIC Name"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email/Phone</Label>
                        <Input
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="col-span-3"
                            placeholder="Email or Phone Number"
                        />
                    </div>

                    {/* Only show Rating if it's a Vendor-like type */}
                    {["Vendor", "Subcon"].includes(formData.type) && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rating" className="text-right">Rating</Label>
                            <Select
                                value={formData.rating}
                                onValueChange={(val) => setFormData({ ...formData, rating: val })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select Grade" />
                                </SelectTrigger>
                                <SelectContent className="z-[205]">
                                    <SelectItem value="A">Grade A (Excellent)</SelectItem>
                                    <SelectItem value="B">Grade B (Good)</SelectItem>
                                    <SelectItem value="C">Grade C (Standard)</SelectItem>
                                    <SelectItem value="D">Grade D (Poor)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit">
                            {mode === "add" ? "Save Stakeholder" : "Update Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
