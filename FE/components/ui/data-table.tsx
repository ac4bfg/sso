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

interface Column<T> {
    key: keyof T | string
    header: string
    className?: string
    render?: (item: T, index: number) => React.ReactNode
}

interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    keyField: keyof T
    emptyMessage?: string
    itemsPerPageOptions?: number[]
    defaultItemsPerPage?: number
}

export function DataTable<T>({
    data,
    columns,
    keyField,
    emptyMessage = "No data found.",
    itemsPerPageOptions = [10, 25, 50, 100],
    defaultItemsPerPage = 10,
}: DataTableProps<T>) {
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)

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

    const getCellValue = (item: T, column: Column<T>, index: number) => {
        if (column.render) {
            return column.render(item, startIndex + index)
        }
        const value = item[column.key as keyof T]
        return value !== undefined && value !== null ? String(value) : '-'
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={String(col.key)} className={col.className}>
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((item, index) => (
                                <TableRow key={String(item[keyField])}>
                                    {columns.map((col) => (
                                        <TableCell key={String(col.key)} className={col.className}>
                                            {getCellValue(item, col, index)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {data.length > 0 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} entries</span>
                        <Select
                            value={String(itemsPerPage)}
                            onValueChange={(val) => {
                                setItemsPerPage(Number(val))
                                setPage(1)
                            }}
                        >
                            <SelectTrigger className="w-[80px] h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {itemsPerPageOptions.map(opt => (
                                    <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span>per page</span>
                    </div>

                    {totalPages > 1 && (
                        <Pagination>
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
