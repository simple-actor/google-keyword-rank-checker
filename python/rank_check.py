"""Which websites rank on Google for a list of keywords: reads one keyword per
line from a file, searches Google (US, English by default) and prints each
keyword's top three, where your domain ranks if you give one, and the sites
that show up across the most keywords. Every result goes to results.csv.

    APIFY_TOKEN=... python rank_check.py ../keywords.txt [yourdomain.com]

DEPTH is results per keyword (default 10 = one page of Google, $0.005).
Google's ranking moves between reads, so run it on more than one day.
"""
import csv
import os
import sys
from collections import defaultdict

from apify_client import ApifyClient

if len(sys.argv) < 2:
    sys.exit("Give a file of keywords, one per line, and optionally your domain")
queries = [l.strip() for l in open(sys.argv[1], encoding="utf-8") if l.strip()]
host = sys.argv[2].removeprefix("www.") if len(sys.argv) > 2 else None

client = ApifyClient(os.environ["APIFY_TOKEN"])
run = client.actor("simple.actor/google-search").call(run_input={
    "queries": queries,
    "maxItems": int(os.environ.get("DEPTH", 10)),
    "country": os.environ.get("COUNTRY", "US"),
    "language": os.environ.get("LANGUAGE", "en-US"),
})
items = list(client.dataset(run.default_dataset_id).iterate_items())

for e in items:
    if e["type"] == "error":
        print(f"{e['query']}: {e['error']} {e['errorDescription']}", file=sys.stderr)
rows = [x for x in items if x["type"] == "result"]


def ours(r):
    return host and (r["domain"] == host or r["domain"].endswith("." + host))


for q in queries:
    rs = sorted((r for r in rows if r["query"] == q), key=lambda r: r["position"])
    top = "   ".join(f"{r['position']}. {r['domain']}" for r in rs[:3])
    hit = next((r for r in rs if ours(r)), None)
    where = "" if not host else f"  | {host} at {hit['position']}" if hit else f"  | {host} not in {len(rs)}"
    print(f"{q} ({len(rs)} rows)\n    {top}{where}")

# Reach: how many of the keywords each site ranked for.
reach = defaultdict(set)
for r in rows:
    reach[r["domain"]].add(r["query"])
wide = sorted(((d, qs) for d, qs in reach.items() if len(qs) > 1), key=lambda kv: -len(kv[1]))
print(f"\n{len(reach)} sites in all; on more than one keyword:")
for d, qs in wide:
    print(f"    {d}: {len(qs)} of {len(queries)}")

cols = ["query", "position", "page", "domain", "title", "link", "date", "snippet"]
with open("results.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
    w.writeheader()
    w.writerows(rows)
print(f"\nwrote {len(rows)} results to results.csv")
