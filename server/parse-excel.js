const xlsx = require('xlsx');

function parse() {
  const workbook = xlsx.readFile('../context/DETAILS(A).xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  console.log(JSON.stringify(data.slice(0, 5), null, 2)); // Print first 5 rows
  console.log(`Total rows: ${data.length}`);
}

parse();
