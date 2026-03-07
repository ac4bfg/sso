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

export type Addendum = {
    value: number
    date?: string
    note?: string
}

export interface Project {
    id: string
    name: string
    client: string
    status: string
    progress: number
    value: number
    budget: number
    realization: number
    startDate?: string
    endDate?: string
    contractNo?: string
    poNo?: string
    location?: string
    group?: string
    addendums?: Addendum[]
}

interface ProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: "add" | "edit"
    initialData?: Project | null
    onSave: (data: Project) => void
}

import { Plus, Trash2 } from "lucide-react"

export function ProjectDialog({
    open,
    onOpenChange,
    mode,
    initialData,
    onSave
}: ProjectDialogProps) {
    const [formData, setFormData] = useState<Project>({
        id: "",
        name: "",
        client: "",
        status: "Ongoing",
        progress: 0,
        value: 0,
        budget: 0,
        realization: 0,
        addendums: []
    })

    useEffect(() => {
        if (mode === "edit" && initialData) {
            setFormData({ ...initialData, addendums: initialData.addendums || [] })
        } else if (mode === "add" && open) {
            setFormData({
                id: Math.random().toString(36).substr(2, 9),
                name: "",
                client: "",
                status: "Ongoing",
                progress: 0,
                value: 0,
                budget: 0,
                realization: 0,
                contractNo: "",
                poNo: "",
                location: "",
                group: "",
                startDate: "",
                endDate: "",
                addendums: []
            })
        }
    }, [mode, initialData, open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData)
        onOpenChange(false)
    }

    const addAddendum = () => {
        setFormData({
            ...formData,
            addendums: [...(formData.addendums || []), { value: 0 }]
        })
    }

    const removeAddendum = (index: number) => {
        const newAddendums = [...(formData.addendums || [])]
        newAddendums.splice(index, 1)
        setFormData({ ...formData, addendums: newAddendums })
    }

    const updateAddendum = (index: number, field: keyof Addendum, value: any) => {
        const newAddendums = [...(formData.addendums || [])]
        newAddendums[index] = { ...newAddendums[index], [field]: value }
        setFormData({ ...formData, addendums: newAddendums })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Removed z-index manual override to use global default */}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === "add" ? "Create New Project" : "Edit Project"}</DialogTitle>
                    <DialogDescription>
                        {mode === "add" ? "Initialize a new project dashboard." : "Update project details."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Project Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                            placeholder="e.g. The Grand Apartment"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="client" className="text-right">Client</Label>
                        <Input
                            id="client"
                            value={formData.client}
                            onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                            className="col-span-3"
                            placeholder="Client Name"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(val) => setFormData({ ...formData, status: val })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent className="z-[205]">
                                <SelectItem value="Ongoing">Ongoing</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Hold">On Hold</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Location & Group */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">Location</Label>
                        <Input id="location" value={formData.location || ""} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="col-span-3" placeholder="Project Location" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="group" className="text-right">Group</Label>
                        <Input id="group" value={formData.group || ""} onChange={(e) => setFormData({ ...formData, group: e.target.value })} className="col-span-3" placeholder="Division/Group" />
                    </div>

                    {/* Contract & PO */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contractNo" className="text-right">Contract No</Label>
                        <Input id="contractNo" value={formData.contractNo || ""} onChange={(e) => setFormData({ ...formData, contractNo: e.target.value })} className="col-span-3" placeholder="Contract Number" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="poNo" className="text-right">PO No</Label>
                        <Input id="poNo" value={formData.poNo || ""} onChange={(e) => setFormData({ ...formData, poNo: e.target.value })} className="col-span-3" placeholder="PO Number" />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startDate" className="text-right">Start Date</Label>
                        <Input id="startDate" type="date" value={formData.startDate || ""} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="endDate" className="text-right">End Date</Label>
                        <Input id="endDate" type="date" value={formData.endDate || ""} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="col-span-3" />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="value" className="text-right">Contract Value</Label>
                        <Input
                            id="value"
                            type="number"
                            value={formData.value}
                            onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                            className="col-span-3"
                            placeholder="0"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="budget" className="text-right">Budget (RAP)</Label>
                        <Input
                            id="budget"
                            type="number"
                            value={formData.budget}
                            onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                            className="col-span-3"
                            placeholder="0"
                        />
                    </div>

                    {/* Dynamic Addendums Section */}
                    <div className="border-t pt-4 mt-2">
                        <div className="flex items-center justify-between mb-2">
                            <Label className="font-semibold">Addendums</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addAddendum}>
                                <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {formData.addendums?.map((addendum, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-1 text-center text-sm text-muted-foreground">#{index + 1}</div>
                                    <div className="col-span-5">
                                        <Input
                                            type="number"
                                            placeholder="Value (Rp)"
                                            value={addendum.value}
                                            onChange={(e) => updateAddendum(index, 'value', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="col-span-5">
                                        <Input
                                            type="text"
                                            placeholder="Note (Optional)"
                                            value={addendum.note || ""}
                                            onChange={(e) => updateAddendum(index, 'note', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAddendum(index)} className="text-destructive hover:text-destructive/90">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {(!formData.addendums || formData.addendums.length === 0) && (
                                <div className="text-sm text-muted-foreground text-center py-2 italic bg-muted/20 rounded-md">
                                    No addendums record.
                                </div>
                            )}
                        </div>
                    </div>


                    <DialogFooter className="mt-4">
                        <Button type="submit">
                            {mode === "add" ? "Create Project" : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    )
}
