"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export interface Transaction {
    id: string
    projectId: string
    type: 'RAP' | 'REALIZATION' | 'COST_TO_GO'
    date: string
    itemCode: string
    description?: string
    qty: number
    unitPrice: number
    total: number
}

interface TransactionTableProps {
    data: Transaction[]
    type: "RAP" | "REALIZATION" | "COST_TO_GO"
    rapItemCodes?: string[] // If provided, items not in this list will be highlighted red
    onEdit?: (transaction: Transaction) => void
    onDelete?: (id: string) => void
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

export function TransactionTable({ data, type, rapItemCodes, onEdit, onDelete }: TransactionTableProps) {
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const totalPages = Math.ceil(data.length / itemsPerPage)
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedData = data.slice(startIndex, endIndex)

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = []
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
            pages.push(1)
            if (page > 3) pages.push('ellipsis')
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                pages.push(i)
            }
            if (page < totalPages - 2) pages.push('ellipsis')
            pages.push(totalPages)
        }
        return pages
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">No</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Cost Code</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No transactions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((item, index) => {
                                const isNotInRap = rapItemCodes && !rapItemCodes.includes(item.itemCode)
                                return (
                                    <TableRow key={item.id} className={isNotInRap ? "bg-red-50 dark:bg-red-950/30" : ""}>
                                        <TableCell className={`font-medium ${isNotInRap ? "text-destructive" : "text-muted-foreground"}`}>{startIndex + index + 1}</TableCell>
                                        <TableCell className={isNotInRap ? "text-destructive" : ""}>{item.date}</TableCell>
                                        <TableCell className={`font-medium text-xs font-mono ${isNotInRap ? "text-destructive" : ""}`}>{item.id}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <Badge variant={isNotInRap ? "outline" : "secondary"} className={isNotInRap ? "w-fit border-red-400 text-red-600 dark:border-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/50" : "w-fit"}>{item.itemCode}</Badge>
                                                {item.description && <span className={`text-xs mt-1 ${isNotInRap ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>{item.description}</span>}
                                                {isNotInRap && <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-0.5">⚠ Not in RAP</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className={`text-right ${isNotInRap ? "text-destructive" : ""}`}>{item.qty}</TableCell>
                                        <TableCell className={`text-right ${isNotInRap ? "text-destructive" : ""}`}>Rp {item.unitPrice.toLocaleString('id-ID')}</TableCell>
                                        <TableCell className={`text-right font-semibold ${isNotInRap ? "text-destructive" : ""}`}>
                                            Rp {item.total.toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-slate-500 hover:text-primary"
                                                    onClick={() => onEdit?.(item)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => onDelete?.(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {data.length > 0 && (
                <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length}</span>
                        <Select
                            value={String(itemsPerPage)}
                            onValueChange={(val) => {
                                setItemsPerPage(Number(val))
                                setPage(1)
                            }}
                        >
                            <SelectTrigger className="w-[70px] h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                                    <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span>per page</span>
                    </div>

                    {totalPages > 1 && (
                        <Pagination className="mx-0 w-auto">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>

                                {getPageNumbers().map((pageNum, idx) => (
                                    <PaginationItem key={idx}>
                                        {pageNum === 'ellipsis' ? (
                                            <PaginationEllipsis />
                                        ) : (
                                            <PaginationLink
                                                onClick={() => setPage(pageNum)}
                                                isActive={page === pageNum}
                                                className="cursor-pointer"
                                            >
                                                {pageNum}
                                            </PaginationLink>
                                        )}
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </div>
            )}
        </div>
    )
}
