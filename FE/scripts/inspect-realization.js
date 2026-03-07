
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const file = 'docs/ex_realization.xlsx';
const fullPath = path.join(process.cwd(), file);

if (fs.existsSync(fullPath)) {
    console.log(`\n--- Inspecting ${file} ---`);
    const workbook = XLSX.readFile(fullPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length > 0) {
        console.log('Headers:', JSON.stringify(data[0]));
        console.log('First Row:', JSON.stringify(data[1]));
    } else {
        console.log('Empty sheet');
    }
} else {
    console.log('File not found');
}
