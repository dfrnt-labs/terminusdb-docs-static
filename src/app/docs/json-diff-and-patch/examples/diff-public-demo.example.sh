#!/bin/bash
# Documentation example: diff-public-demo
# Source: src/app/docs/json-diff-and-patch/page.md

set -e

# region: display
curl -X POST https://data.terminusdb.org/api/diff \
  -H "Content-Type: application/json" \
  -d '{"before": {"name": "Alice"}, "after": {"name": "Bob"}}'
# endregion
