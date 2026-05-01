#!/bin/bash
# Documentation example: patch-public-demo
# Source: src/app/docs/json-diff-and-patch/page.md:358
#
# This file is the canonical source for this example.
# It is referenced by the docs page and executed by the test runner.
#
# Environment variables available:
#   TERMINUSDB_URL (default: http://localhost:6363)
#   TERMINUSDB_USER (default: admin)
#   TERMINUSDB_KEY (default: root)

set -e

TERMINUSDB_URL="${TERMINUSDB_URL:-http://localhost:6363}"

curl -X POST "${TERMINUSDB_URL}/api/patch" \
  -H "Content-Type: application/json" \
  -d '{"before": {"name": "Alice"}, "patch": {"name": {"@op": "SwapValue", "@before": "Alice", "@after": "Bob"}}}'
