const XLSX = require('xlsx');
const path = require('path');

const file = 'docs/ex_rap.xlsx';
const fullPath = path.join(process.cwd(), file);

const workbook = XLSX.readFile(fullPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('=== All RAP File Rows ===');
for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i];
    if (row && row.length > 0) {
        console.log(`Row ${i}:`, JSON.stringify(row));
    }
}
