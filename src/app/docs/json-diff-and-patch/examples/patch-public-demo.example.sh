#!/bin/bash
# Documentation example: patch-public-demo
# Source: src/app/docs/json-diff-and-patch/page.md

set -e

# region: display
curl -X POST https://data.terminusdb.org/api/patch \
  -H "Content-Type: application/json" \
  -d '{"before": {"name": "Alice"}, "patch": {"name": {"@op": "SwapValue", "@before": "Alice", "@after": "Bob"}}}'
# endregion
