import fs from 'fs';
import path from 'path';

const IN_FILE = path.join(__dirname, 'eval_results.json');
const results = JSON.parse(fs.readFileSync(IN_FILE, 'utf-8'));

console.log("=== 1. EXECUTION COUNT CONTRADICTION ===");
const totalAttempted = Object.keys(results).length;
let fullyExecuted = 0;
let fallbackExecuted = 0;
let quotaErrors = 0;
let otherErrors = 0;
const fullyExecIds: string[] = [];
const fallbackExecIds: string[] = [];
const quotaIds: string[] = [];
const otherErrorIds: string[] = [];

for (const [id, r] of Object.entries(results) as any) {
    if (r.status === 'ERROR') {
        if (r.errorName === 'rate_limit' || (r.errorMessage && r.errorMessage.includes('429'))) {
            quotaErrors++;
            quotaIds.push(id);
        } else {
            otherErrors++;
            otherErrorIds.push(id);
        }
    } else {
        if (r.diagnostics.fallbackUsed) {
            fallbackExecuted++;
            fallbackExecIds.push(id);
        } else {
            fullyExecuted++;
            fullyExecIds.push(id);
        }
    }
}
console.log(`Total Attempted: ${totalAttempted}`);
console.log(`Fully Executed (no fallback): ${fullyExecuted} - ${fullyExecIds.join(', ')}`);
console.log(`Fallback Executed: ${fallbackExecuted} - ${fallbackExecIds.join(', ')}`);
console.log(`Not Executed (Quota): ${quotaErrors} - ${quotaIds.join(', ')}`);
console.log(`Not Executed (Other): ${otherErrors} - ${otherErrorIds.join(', ')}`);

console.log("\n=== 2. GEO PIPELINE CONTRADICTION (Q29-Q34) ===");
['Q29', 'Q30', 'Q31', 'Q32', 'Q33', 'Q34'].forEach(id => {
    const r = results[id];
    if (!r) return;
    console.log(`\n${id}: ${r.queryConfig.q}`);
    console.log(`Input supplied userLocation: ${r.queryConfig.lat !== undefined}`);
    console.log(`Parsed Plan: ${JSON.stringify(r.parsedPlan)}`);
    console.log(`locationIntent: ${r.diagnostics.locationIntent}`);
    console.log(`sortIntent: ${r.diagnostics.sortIntent}`);
    console.log(`fallbackUsed: ${r.diagnostics.fallbackUsed}`);
    console.log(`geoApplied: ${r.diagnostics.geoApplied}`);
    console.log(`geoCandidateCount: ${r.diagnostics.geoCandidateCount}`);
    console.log(`vectorCandidateCount: ${r.diagnostics.vectorCandidateCount}`);
});

console.log("\n=== 3. TEXTUAL LOCATION CONTRADICTION (Q35) ===");
const q35 = results['Q35'];
if (q35) {
    console.log(`Parsed Plan: ${JSON.stringify(q35.parsedPlan)}`);
    console.log(`placeText: ${q35.parsedPlan?.location?.placeText}`);
    console.log(`fallbackUsed: ${q35.diagnostics.fallbackUsed}`);
    console.log(`errorName: ${q35.errorName}`);
    console.log(`errorMessage: ${q35.errorMessage}`);
}

console.log("\n=== 4. Q10 DIRECT DATA CONTRADICTION ===");
const q10 = results['Q10'];
if (q10) {
    console.log(`Parsed Plan: ${JSON.stringify(q10.parsedPlan)}`);
    console.log(`Normalized Filters: ${JSON.stringify(q10.diagnostics.normalizedFilters)}`);
    console.log(`maxBudget: ${q10.diagnostics.normalizedFilters?.maxBudget}`);
    console.log(`Atlas filter: ${JSON.stringify(q10.diagnostics.atlasFilter)}`);
    console.log(`vectorCandidateCount: ${q10.diagnostics.vectorCandidateCount}`);
    console.log(`slotRejectedCount: ${q10.diagnostics.slotRejectedCount}`);
    console.log(`finalResultCount: ${q10.diagnostics.finalResultCount}`);
}

console.log("\n=== 5. STRICT FILTER AUDIT (Q05, Q20, Q23, Q24, Q25, Q26, Q28) ===");
['Q05', 'Q20', 'Q23', 'Q24', 'Q25', 'Q26', 'Q28'].forEach(id => {
    const r = results[id];
    if (!r) return;
    console.log(`\n${id}: ${r.queryConfig.q}`);
    console.log(`fallbackUsed: ${r.diagnostics.fallbackUsed}`);
    console.log(`Parsed Plan: ${JSON.stringify(r.parsedPlan)}`);
    console.log(`Normalized Filters: ${JSON.stringify(r.diagnostics.normalizedFilters)}`);
    console.log(`Atlas filter: ${JSON.stringify(r.diagnostics.atlasFilter)}`);
    if (r.results && r.results.length > 0) {
        console.log(`Top 1: ${r.results[0].name} (Score: ${r.results[0].score})`);
        console.log(`Top 1 Slots: ${JSON.stringify(r.results[0].slots)}`);
    } else {
        console.log(`Top 1: None`);
    }
});

console.log("\n=== 6. PARSER FALLBACK CLASSIFICATION ===");
for (const id of fallbackExecIds) {
    const r = results[id];
    console.log(`\n${id}: ${r.queryConfig.q}`);
    console.log(`Semantic Query: ${r.diagnostics.semanticQuery}`);
    console.log(`Filters after fallback: ${JSON.stringify(r.diagnostics.normalizedFilters)}`);
    console.log(`locationIntent after fallback: ${r.diagnostics.locationIntent}`);
    console.log(`sortIntent after fallback: ${r.diagnostics.sortIntent}`);
}
