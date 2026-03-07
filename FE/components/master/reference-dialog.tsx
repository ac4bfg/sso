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
import { useEffect, useState } from "react"

export interface ReferenceItem {
    id: string
    code: string
    name: string
    desc: string
}

interface ReferenceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: "add" | "edit"
    type: "unit" | "group"
    initialData?: ReferenceItem | null
    onSave: (data: ReferenceItem) => void
}

export function ReferenceDialog({
    open,
    onOpenChange,
    mode,
    type,
    initialData,
    onSave
}: ReferenceDialogProps) {
    const [formData, setFormData] = useState<ReferenceItem>({
        id: "",
        code: "",
        name: "",
        desc: ""
    })

    useEffect(() => {
        if (mode === "edit" && initialData) {
            setFormData(initialData)
        } else {
            setFormData({
                id: Math.random().toString(36).substr(2, 9),
                code: "",
                name: "",
                desc: ""
            })
        }
    }, [mode, initialData, open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "add" ? "Add " : "Edit "}
                        {type === "unit" ? "Unit" : "Project Group"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "add" ? "Create a new reference item." : "Update reference details."}
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
                            placeholder={type === "unit" ? "e.g. m3" : "e.g. HRB"}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                            placeholder={type === "unit" ? "e.g. Meter Kubik" : "e.g. High Rise Building"}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="desc" className="text-right">Description</Label>
                        <Input
                            id="desc"
                            value={formData.desc}
                            onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                            className="col-span-3"
                            placeholder="Optional explanation"
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
