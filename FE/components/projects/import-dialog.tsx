"use client"

import { useState, useRef } from "react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react"
import * as XLSX from "xlsx"
import { Transaction } from "./transaction-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    type: "RAP" | "REALIZATION" | "COST_TO_GO"
    projectId: string
    onImport: (transactions: Transaction[]) => void
}

export function ImportDialog({
    open,
    onOpenChange,
    type,
    projectId,
    onImport
}: ImportDialogProps) {
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<Transaction[]>([])
    const [page, setPage] = useState(1)
    const [isParsing, setIsParsing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setError(null)
            parseExcel(selectedFile)
        }
    }

    const parseExcel = async (file: File) => {
        setIsParsing(true)
        setPreviewData([])
        setError(null)

        try {
            const arrayBuffer = await file.arrayBuffer()
            const workbook = XLSX.read(arrayBuffer)
            const sheetName = workbook.SheetNames[0]
            const sheet = workbook.Sheets[sheetName]

            // Get raw data assuming first row is header
            const rawData = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 })

            console.log("Found Raw Data Rows:", rawData.length)

            if (rawData.length === 0) {
                throw new Error("Sheet kosong")
            }

            const transactions: Transaction[] = []

            // Detect format type based on first row content
            const firstRow = rawData[0] as any[];
            const firstRowStr = JSON.stringify(firstRow || []).toUpperCase();

            const isRAPFormat = firstRowStr.includes('HPP') || firstRowStr.includes('HARGA POKOK');
            const isRealizationFormat = firstRowStr.includes('TGL') && firstRowStr.includes('BEBAN');

            console.log("Format detected:", isRAPFormat ? "RAP (HPP)" : isRealizationFormat ? "Realization" : "Unknown, trying both...");

            if (isRAPFormat || type === "RAP") {
                // RAP Format: Rows with [index, no, description, ..., qty, satuan, harga satuan, jumlah]
                // Structure: First row is title, then metadata rows, then data rows with numbers

                // Find header row with "NO", "URAIAN", "SATUAN" etc
                let headerRowIndex = -1;
                for (let i = 0; i < Math.min(rawData.length, 15); i++) {
                    const row = rawData[i] as any[];
                    if (!row) continue;
                    const rowStr = JSON.stringify(row).toUpperCase();
                    if (rowStr.includes('NO') && (rowStr.includes('URAIAN') || rowStr.includes('KETERANGAN'))) {
                        headerRowIndex = i;
                        console.log("RAP Header found at row:", i, row);
                        break;
                    }
                }

                // If no header found, look for data pattern (rows starting with numbers)
                const dataStartIndex = headerRowIndex !== -1 ? headerRowIndex + 1 : 8;

                for (let i = dataStartIndex; i < rawData.length; i++) {
                    const row = rawData[i] as any[];
                    if (!row || row.length < 3) continue;

                    // Look for rows with numeric data (item rows, not category headers)
                    // Pattern: [null/letter, number, description, ...]
                    const firstCell = row[0];
                    const secondCell = row[1];
                    const thirdCell = row[2];

                    // Skip category header rows (rows starting with letters like "A.", "B.")
                    if (typeof firstCell === 'string' && /^[A-Z]\.?$/.test(firstCell)) {
                        continue;
                    }

                    // Look for data rows (often has a number in column 1 or 2)
                    const descriptionIdx = typeof thirdCell === 'string' && thirdCell.length > 3 ? 2 :
                        typeof secondCell === 'string' && secondCell.length > 3 ? 1 : -1;

                    if (descriptionIdx === -1) continue;

                    const description = String(row[descriptionIdx] || '');
                    if (!description || description === 'null') continue;

                    // Find amount (usually the last numeric columns)
                    let amount = 0;
                    for (let j = row.length - 1; j >= 4; j--) {
                        const val = row[j];
                        if (typeof val === 'number' && val > 0) {
                            amount = val;
                            break;
                        }
                    }

                    if (amount > 0 || description) {
                        transactions.push({
                            id: `IMP-${Date.now()}-${i}`,
                            projectId: projectId,
                            type: type,
                            date: new Date().toISOString().split('T')[0],
                            itemCode: typeof secondCell === 'number' ? `ITEM-${secondCell}` : String(secondCell || `ITEM-${i}`),
                            description: description,
                            qty: 1,
                            unitPrice: amount,
                            total: amount,
                        })
                    }
                }
            } else {
                // Realization Format: Ledger style with TGL, BUKTI, BEBAN, URAIAN, DEBET, KREDIT
                let headerRowIndex = -1;
                const expectedHeaders = ["TGL", "BEBAN", "DEBET"];

                for (let i = 0; i < Math.min(rawData.length, 10); i++) {
                    const row = rawData[i] as any[];
                    if (!row) continue;
                    const hasKeyCols = expectedHeaders.every(h =>
                        row.some(cell => typeof cell === 'string' && cell.toUpperCase().includes(h))
                    );

                    if (hasKeyCols) {
                        headerRowIndex = i;
                        console.log("Realization Header found at row:", i, row);
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    headerRowIndex = 0;
                }

                const headersRaw = rawData[headerRowIndex] as any[];
                if (!headersRaw || headersRaw.length === 0) {
                    throw new Error("Header row tidak ditemukan atau kosong")
                }
                const headers = headersRaw.map(h => String(h ?? '').trim().toUpperCase());
                const rows = rawData.slice(headerRowIndex + 1);

                const colMap = {
                    date: headers.findIndex(h => h.includes("TGL")),
                    itemCode: headers.findIndex(h => h.includes("BEBAN")),
                    desc: headers.findIndex(h => h.includes("URAIAN")),
                    debet: headers.findIndex(h => h.includes("DEBET")),
                    kredit: headers.findIndex(h => h.includes("KREDIT")),
                }

                console.log("Column Mapping:", colMap);

                if (colMap.itemCode === -1) {
                    throw new Error(`Kolom BEBAN tidak ditemukan. Header yang ditemukan: ${headers.join(', ')}`)
                }

                rows.forEach((row: any[], index) => {
                    if (!row || row.length === 0) return

                    const itemCodeRaw = row[colMap.itemCode];
                    if (!itemCodeRaw) return;

                    let dateStr = new Date().toISOString().split('T')[0];
                    const dateRaw = colMap.date !== -1 ? row[colMap.date] : null;
                    if (typeof dateRaw === 'number') {
                        const dateObj = new Date((dateRaw - 25569) * 86400 * 1000);
                        if (!isNaN(dateObj.getTime())) {
                            dateStr = dateObj.toISOString().split('T')[0];
                        }
                    } else if (typeof dateRaw === 'string' && dateRaw.includes("-")) {
                        dateStr = dateRaw;
                    }

                    const debetVal = colMap.debet !== -1 ? row[colMap.debet] : 0;
                    const kreditVal = colMap.kredit !== -1 ? row[colMap.kredit] : 0;
                    const amount = parseFloat(debetVal) || parseFloat(kreditVal) || 0;

                    if (amount > 0) {
                        transactions.push({
                            id: `IMP-${Date.now()}-${index}`,
                            projectId: projectId,
                            type: type,
                            date: dateStr,
                            itemCode: String(itemCodeRaw),
                            description: colMap.desc !== -1 && row[colMap.desc] ? String(row[colMap.desc]) : undefined,
                            qty: 1,
                            unitPrice: amount,
                            total: amount,
                        })
                    }
                })
            }

            console.log(`Parsed ${transactions.length} transactions`);

            if (transactions.length === 0) {
                throw new Error("Tidak ada data transaksi yang ditemukan. Pastikan file memiliki data yang valid.")
            }

            setPreviewData(transactions)
            setPage(1)

        } catch (err: any) {
            console.error("Parse Error:", err)
            setError(err.message || "Gagal parsing file Excel. Pastikan formatnya sesuai template.")
        } finally {
            setIsParsing(false)
        }
    }

    const handleSubmit = () => {
        onImport(previewData)
        setFile(null)
        setPreviewData([])
        onOpenChange(false)
    }

    const reset = () => {
        setFile(null)
        setPreviewData([])
        setError(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) reset();
            onOpenChange(val);
        }}>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import {type === "RAP" ? "RAP (Budget)" : type === "COST_TO_GO" ? "Cost To Go" : "Realization"} Data</DialogTitle>
                    <DialogDescription>
                        Upload an Excel file to bulk import transactions. Supported formats: .xlsx, .xls
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    {!file && (
                        <div
                            className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                            <h3 className="font-medium text-lg">Click to upload or drag and drop</h3>
                            <p className="text-sm text-muted-foreground mt-1">Excel files matching the template</p>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    )}

                    {isParsing && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p className="text-sm text-muted-foreground">Parsing Excel file...</p>
                        </div>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {previewData.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">Preview ({previewData.length} items found)</h4>
                                <Button variant="outline" size="sm" onClick={reset}>Change File</Button>
                            </div>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Cost Code</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Amount (Total)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.slice((page - 1) * 10, page * 10).map((row, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{row.date}</TableCell>
                                                <TableCell>{row.itemCode}</TableCell>
                                                <TableCell className="max-w-[200px] truncate">{row.description}</TableCell>
                                                <TableCell className="text-right">Rp {row.total.toLocaleString("id-ID")}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Controls */}
                            {previewData.length > 10 && (
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground">
                                        Page {page} of {Math.ceil(previewData.length / 10)}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(Math.ceil(previewData.length / 10), p + 1))}
                                            disabled={page >= Math.ceil(previewData.length / 10)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={previewData.length === 0 || isParsing}>
                        Import {previewData.length} Transactions
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
