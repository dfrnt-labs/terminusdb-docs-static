#!/usr/bin/env bash
# Check that every URL in the live sitemap answers with HTTP 200.
#
# - Reads the sitemap (index or URL list) and follows child sitemaps.
# - Follows redirects. A URL fails only if the final answer is not 200.
# - Redirected URLs that end in 200 are listed as a note, not a failure.
# - Writes a markdown report to $REPORT and exits 1 if any URL failed.
#
# Env:
#   SITEMAP_URL  default https://terminusdb.com/sitemap.xml
#   REPORT       default sitemap-report.md
#   MAX_URLS     optional, only check the first N URLs (for local tests)
#   PARALLEL     default 4 parallel requests
#   DELAY        default 0.2 seconds pause per request (per worker)
set -uo pipefail

SITEMAP_URL="${SITEMAP_URL:-https://terminusdb.com/sitemap.xml}"
REPORT="${REPORT:-sitemap-report.md}"
MAX_URLS="${MAX_URLS:-}"
PARALLEL="${PARALLEL:-4}"
DELAY="${DELAY:-0.2}"
UA="Mozilla/5.0 (compatible; TerminusDB-docs-weekly-check)"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

locs() {
  curl -sSL --max-time 30 -A "$UA" "$1" | grep -o '<loc>[^<]*' | sed 's/<loc>//; s/[[:space:]]*$//'
}

# Expand sitemap index entries into page URLs (one level deep).
: > "$work/urls.txt"
if ! curl -sSL --max-time 30 -A "$UA" -o "$work/root.xml" "$SITEMAP_URL"; then
  printf '## Live sitemap check\n\nCould not fetch %s\n' "$SITEMAP_URL" > "$REPORT"
  exit 1
fi
if grep -q '<sitemapindex' "$work/root.xml"; then
  grep -o '<loc>[^<]*' "$work/root.xml" | sed 's/<loc>//' | while read -r child; do
    locs "$child" >> "$work/urls.txt"
  done
else
  grep -o '<loc>[^<]*' "$work/root.xml" | sed 's/<loc>//' >> "$work/urls.txt"
fi

sort -u "$work/urls.txt" -o "$work/urls.txt"
total=$(wc -l < "$work/urls.txt" | tr -d ' ')
if [ -n "$MAX_URLS" ]; then
  head -n "$MAX_URLS" "$work/urls.txt" > "$work/urls.tmp" && mv "$work/urls.tmp" "$work/urls.txt"
fi

export UA DELAY
# Output per line: <final_code> <redirect_count> <url> <final_url>
xargs -P "$PARALLEL" -I{} sh -c '
  out=$(curl -s -o /dev/null -L --max-redirs 5 --max-time 30 -A "$UA" \
        -w "%{http_code} %{num_redirects} %{url_effective}" "$1")
  [ -z "$out" ] && out="000 0 -"
  set -- $out "$1"
  echo "$1 $2 $4 $3"
  sleep "$DELAY"
' _ {} < "$work/urls.txt" > "$work/status.txt"

checked=$(wc -l < "$work/status.txt" | tr -d ' ')
awk '$1 != "200"' "$work/status.txt" | sort > "$work/fail.txt"
awk '$1 == "200" && $2 != "0"' "$work/status.txt" | sort > "$work/redir.txt"
fails=$(wc -l < "$work/fail.txt" | tr -d ' ')
redirs=$(wc -l < "$work/redir.txt" | tr -d ' ')

{
  echo "## Live sitemap check"
  echo
  echo "Sitemap: $SITEMAP_URL"
  echo "URLs in sitemap: $total, checked: $checked, not 200: $fails, redirected to 200: $redirs"
  echo
  echo "Status counts:"
  echo
  awk '{print $1}' "$work/status.txt" | sort | uniq -c | sort -rn | awk '{print "- " $2 ": " $1}'
  if [ "$fails" -gt 0 ]; then
    echo
    echo "### URLs that do not return 200"
    echo
    awk '{print "- `" $1 "` " $3 (($4 != $3) ? " → " $4 : "")}' "$work/fail.txt"
  fi
  if [ "$redirs" -gt 0 ]; then
    echo
    echo "### Sitemap URLs that redirect (end in 200, not a failure)"
    echo
    awk '{print "- " $3 " → " $4}' "$work/redir.txt"
  fi
} > "$REPORT"

cat "$REPORT"
[ "$fails" -eq 0 ] && [ "$checked" -gt 0 ]
