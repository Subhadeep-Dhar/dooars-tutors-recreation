import fs from 'fs';
import path from 'path';

const OUT_FILE = path.join(__dirname, 'eval_results.json');
const results = JSON.parse(fs.readFileSync(OUT_FILE, 'utf-8'));

for (const qId of Object.keys(results)) {
  const r = results[qId];
  console.log(`\n=== ${qId} ===`);
  console.log(`Query: ${r.queryConfig.q}`);
  console.log(`Status: ${r.status}`);
  if (r.status === 'ERROR') {
    console.log(`Error: ${r.errorMessage}`);
  } else {
    console.log(`Geo Applied: ${r.diagnostics.geoApplied}, Candidates: ${r.diagnostics.geoCandidateCount}`);
    console.log(`Vector Candidates: ${r.diagnostics.vectorCandidateCount}`);
    console.log(`Slot Rejected: ${r.diagnostics.slotRejectedCount}`);
    console.log(`Final Result Count: ${r.diagnostics.finalResultCount}`);
    if (r.results && r.results.length > 0) {
      console.log(`Top 2 Results:`);
      for (const res of r.results.slice(0, 2)) {
         console.log(`  - ${res.name} (${res.type}) | Score: ${res.score?.toFixed(3) || 'N/A'} | Slots: ${res.slots?.map((s:any) => s.subject || s.activity).join(', ')}`);
      }
    }
  }
}
