
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const files = ['docs/ex_rap.xlsx', 'docs/ex_realization.xlsx'];

files.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
        console.log(`\n--- Inspecting ${file} ---`);
        const workbook = XLSX.readFile(fullPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (data.length > 0) {
            console.log('Headers:', JSON.stringify(data[0]));
            if (data.length > 1) console.log('Row 1:', JSON.stringify(data[1]));
            if (data.length > 2) console.log('Row 2:', JSON.stringify(data[2]));
        } else {
            console.log('Empty sheet');
        }
    }
});
