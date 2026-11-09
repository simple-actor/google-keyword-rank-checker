// Which websites rank on Google for a list of keywords: reads one keyword per
// line from a file, searches Google (US, English by default) and prints each
// keyword's top three, where your domain ranks if you give one, and the sites
// that show up across the most keywords. Every result goes to results.csv.
//
//   APIFY_TOKEN=... node rank-check.mjs ../keywords.txt [yourdomain.com]
//
// DEPTH is results per keyword (default 10 = one page of Google, $0.005).
// Google's ranking moves between reads, so run it on more than one day.
import { readFileSync, writeFileSync } from 'node:fs';
import { ApifyClient } from 'apify-client';

const [file, mine] = process.argv.slice(2);
if (!file) throw new Error('Give a file of keywords, one per line, and optionally your domain');
const queries = readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
const run = await client.actor('simple.actor/google-search').call({
    queries,
    maxItems: Number(process.env.DEPTH ?? 10),
    country: process.env.COUNTRY ?? 'US',
    language: process.env.LANGUAGE ?? 'en-US',
});
const { items } = await client.dataset(run.defaultDatasetId).listItems();

for (const e of items.filter((x) => x.type === 'error')) console.warn(`${e.query}: ${e.error} ${e.errorDescription}`);
const rows = items.filter((x) => x.type === 'result');
const host = mine?.replace(/^www\./, '');
const ours = (r) => host && (r.domain === host || r.domain.endsWith(`.${host}`));

for (const q of queries) {
    const rs = rows.filter((r) => r.query === q).sort((a, b) => a.position - b.position);
    const top = rs.slice(0, 3).map((r) => `${r.position}. ${r.domain}`).join('   ');
    const hit = rs.find(ours);
    const where = !host ? '' : hit ? `  | ${host} at ${hit.position}` : `  | ${host} not in ${rs.length}`;
    console.log(`${q} (${rs.length} rows)\n    ${top}${where}`);
}

// Reach: how many of the keywords each site ranked for.
const reach = new Map();
for (const r of rows) reach.set(r.domain, (reach.get(r.domain) ?? new Set()).add(r.query));
const wide = [...reach].filter(([, qs]) => qs.size > 1).sort((a, b) => b[1].size - a[1].size);
console.log(`\n${reach.size} sites in all; on more than one keyword:`);
for (const [d, qs] of wide) console.log(`    ${d}: ${qs.size} of ${queries.length}`);

const cols = ['query', 'position', 'page', 'domain', 'title', 'link', 'date', 'snippet'];
const cell = (x) => (x == null ? '' : `"${String(x).replace(/"/g, '""')}"`);
writeFileSync('results.csv', [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n') + '\n');
console.log(`\nwrote ${rows.length} results to results.csv`);
