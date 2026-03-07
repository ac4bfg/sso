
export const KPIS = [
    { label: "Total Active Projects", value: "12", change: "+2", trend: "up" },
    { label: "Total Contract Value", value: "Rp 14.5 M", change: "+1.2M", trend: "up" },
    { label: "YTD Expenses", value: "Rp 8.2 M", change: "+5%", trend: "down" },
    { label: "Critical Projects", value: "2", change: "Over Budget", trend: "neutral" },
]

export const CHART_DATA = [
    { name: 'Jan', rap: 4000, real: 2400 },
    { name: 'Feb', rap: 3000, real: 1398 },
    { name: 'Mar', rap: 2000, real: 9800 },
    { name: 'Apr', rap: 2780, real: 3908 },
    { name: 'May', rap: 1890, real: 4800 },
    { name: 'Jun', rap: 2390, real: 3800 },
    { name: 'Jul', rap: 3490, real: 4300 },
    { name: 'Aug', rap: 4200, real: 3800 },
    { name: 'Sep', rap: 3100, real: 2900 },
    { name: 'Oct', rap: 2800, real: 2100 },
    { name: 'Nov', rap: 3500, real: 3200 },
    { name: 'Dec', rap: 4500, real: 4100 },
]

export const RECENT_ACTIVITIES = [
    { project: "KSM-24P047 - Wet Calibration", action: "Material Request Approved", user: "Sigit", time: "2h ago" },
    { project: "KSM-24P085 - Ultrasonic Flow Meter", action: "RAP Adjusted", user: "Nita", time: "5h ago" },
    { project: "KSM-25P002 - Supply Metering Gas", action: "New Invoice Created", user: "Finance", time: "1d ago" },
]

export const MASTER_GROUPS = [
    { id: 1, name: "Trading", description: "Jual Beli Barang" },
    { id: 2, name: "Jasa", description: "Jasa Instalasi & Maintenance" },
    { id: 3, name: "Inspeksi", description: "Inspeksi Teknik" },
]

export const MASTER_CLIENTS = [
    { id: 1, name: "PT PERUSAHAAN GAS NEGARA Tbk", type: "Client", contact: "Bpk. Budi", phone: "0812345678" },
    { id: 2, name: "PT SURYA ENERGI PARAHITA", type: "Client", contact: "Ibu Sinta", phone: "0819876543" },
    { id: 3, name: "PT TRANSPORTASI GAS INDONESIA", type: "Client", contact: "Pak Andi", phone: "0813456789" },
    { id: 4, name: "PT MULIAGLASS", type: "Vendor", contact: "Larry D Borman", phone: "0218935722" },
    { id: 5, name: "PT BANTEN INTI GASINDO", type: "Vendor", contact: "Rachmad", phone: "08111906165" },
]

export interface CostItem {
    id: string
    code: string
    name: string
    unit: string
    children?: CostItem[]
}

export const COST_ITEMS: CostItem[] = [
    {
        id: "1", code: "5000", name: "HPP Material", unit: "",
        children: [
            {
                id: "1-1", code: "5100", name: "Material PO Kantor", unit: "",
                children: [
                    { id: "1-1-1", code: "5110.001", name: "Ultra Sonic Gas Meter (USM)", unit: "Unit" },
                    { id: "1-1-2", code: "5110.002", name: "Turbine Meter", unit: "Unit" },
                    { id: "1-1-3", code: "5110.003", name: "Junior Orifice", unit: "Set" },
                ]
            },
            {
                id: "1-2", code: "5200", name: "Material Lapangan", unit: "",
                children: [
                    { id: "1-2-1", code: "5210.001", name: "Pipa Schedule 40", unit: "Batang" },
                    { id: "1-2-2", code: "5210.002", name: "Fitting & Flange", unit: "Lot" },
                ]
            }
        ]
    },
    {
        id: "2", code: "6000", name: "HPP Jasa & Upah", unit: "",
        children: [
            { id: "2-1", code: "6100", name: "Gaji Lapangan", unit: "Mandays" },
            { id: "2-2", code: "6200", name: "Akomodasi & Transport", unit: "Ls" },
        ]
    }
]

export const PROJECTS = [
    {
        id: "KSM-24P047",
        name: "Wet Calibration Ultrasonic Duri 2 Metering Station",
        client: "PT PERUSAHAAN GAS NEGARA Tbk",
        value: 6650000000,
        startDate: "2025-05-05",
        endDate: "2026-05-30",
        status: "Ongoing",
        progress: 65,
        budget: 4587651341,
        realization: 2408907386,
        contractNo: "000100.SPK/LG.01/PPK-MTRT/PGAS/VI/2025",
        poNo: "PO-2025-0047",
        location: "Gudang PGN Klender",
        group: "Jasa",
        addendums: [
            { value: 150000000, note: "Scope extension" },
            { value: 50000000, note: "Material cost adjustment" }
        ]
    },
    {
        id: "KSM-24P085",
        name: "Pengadaan Ultrasonic Flow Meter (USM)",
        client: "PT TRANSPORTASI GAS INDONESIA",
        value: 3900549508,
        startDate: "2025-06-01",
        endDate: "2025-12-30",
        status: "Ongoing",
        progress: 40,
        budget: 2100000000,
        realization: 800000000,
        contractNo: "000125.SPK/LG.02/PPK-TGI/PGAS/VI/2025",
        poNo: "PO-2025-0085",
        location: "Station TGI Jambi",
        group: "Trading",
        addendums: [
            { value: 150000000, note: "Additional units" }
        ]
    },
    {
        id: "KSM-25P002",
        name: "Supply of Metering Gas System",
        client: "PT MULIAGLASS",
        value: 4730003730,
        startDate: "2025-07-15",
        endDate: "2026-07-15",
        status: "Preparation",
        progress: 5,
        budget: 3500000000,
        realization: 50000000,
        contractNo: "000201.SPK/LG.01/PPK-MG/PGAS/VII/2025",
        poNo: "PO-2025-0102",
        location: "Plant Cikarang",
        group: "Inspeksi",
        addendums: []
    },
]

// Mock transactions linked to Project ID and Cost Item Code
export const TRANSACTIONS = [
    { id: "TRX-001", projectId: "KSM-24P047", itemCode: "5110.001", type: "RAP", qty: 2, unitPrice: 15000000, total: 30000000, date: "2025-05-10" },
    { id: "TRX-002", projectId: "KSM-24P047", itemCode: "5110.001", type: "REALIZATION", qty: 1, unitPrice: 15500000, total: 15500000, date: "2025-05-20" },
    { id: "TRX-003", projectId: "KSM-24P047", itemCode: "6100", type: "RAP", qty: 50, unitPrice: 200000, total: 10000000, date: "2025-05-10" },
    { id: "TRX-004", projectId: "KSM-24P047", itemCode: "6100", type: "REALIZATION", qty: 20, unitPrice: 200000, total: 4000000, date: "2025-06-01" },
    { id: "TRX-005", projectId: "KSM-24P047", itemCode: "5110.001", type: "COST_TO_GO", qty: 1, unitPrice: 14500000, total: 14500000, date: "2025-07-01" },
    { id: "TRX-006", projectId: "KSM-24P047", itemCode: "6100", type: "COST_TO_GO", qty: 30, unitPrice: 200000, total: 6000000, date: "2025-07-01" },
    { id: "TRX-007", projectId: "KSM-24P047", itemCode: "5210.001", type: "REALIZATION", qty: 10, unitPrice: 850000, total: 8500000, date: "2025-06-15", description: "Pipa Schedule 40 - pembelian lapangan" },
    { id: "TRX-008", projectId: "KSM-24P047", itemCode: "5210.001", type: "COST_TO_GO", qty: 5, unitPrice: 850000, total: 4250000, date: "2025-07-01", description: "Pipa Schedule 40 - estimasi sisa kebutuhan" },
]

export const APPROVALS = [
    { id: "REQ-001", type: "RAP Adjustment", project: "KSM-24P047", user: "Sigit", amount: 15000000, status: "Pending", date: "2025-08-01" },
    { id: "REQ-002", type: "Payment Request", project: "KSM-24P085", user: "Nita", amount: 45000000, status: "Pending", date: "2025-08-02" },
    { id: "REQ-003", type: "RAP New Item", project: "KSM-25P002", user: "Admin", amount: 5000000, status: "Pending", date: "2025-08-03" },
]
