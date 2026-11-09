# Runs behind the post

All on 2026-11-09 (UTC), google-search build 0.1.17 (latest), web search, US
edition in English (`country` "US", `language` "en-US"), through the daily
routine's Apify credential (its check reported the account `simple.actor`). The
caller price uses the listing's price read the same day: $0.005 per `web-search`
(one results page read) plus $0.00005 for `apify-actor-start`. Every page in all
four runs went through Apify's Google SERP proxy (`PROXY_SERPS` equals the pages
read).

| Run | Input | Result | Time | Platform usage | Caller price |
|---|---|---|---|---|---|
| `SRfFbCWx22omy52B4` | the ten espresso searches in the post, maxItems 30 | 117 results from 85 sites, 18 pages, no error rows | 210s | $0.0462 | $0.09005 |
| `WCguJQ8V2pf7RcNN0` | "best espresso machine", "espresso machine vs nespresso", "how to dial in espresso", maxItems 30, started 2 to 4 minutes after the first run read them | 21 results, 4 pages | 46s | $0.0029 | $0.02005 |
| `kR8vIScR0omR2NnjH` | `node/rank-check.mjs` on "espresso tamper" and "milk frothing pitcher", domain seattlecoffeegear.com, DEPTH=10 | 13 results, 2 pages | 35s | $0.0057 | $0.01005 |
| `QUA17UxHm6jGAG2M4` | `python/rank_check.py` on "how to steam milk for latte art", domain youtube.com, DEPTH=10 | 4 results, 1 page | 19s | $0.0029 | $0.00505 |

The post's numbers come from the first two runs. The first run's memory peaked
at 256.0MB (`memMaxBytes` 255,975,424) on the listing's 256MB default.

Regenerate the numbers and images: save the first two runs with
`marketing/tools/apify_api.py run` to /tmp/google-search-run.json and
/tmp/google-search-run2.json, then `python3 analyse.py` and
`python3 images/make.py`.
