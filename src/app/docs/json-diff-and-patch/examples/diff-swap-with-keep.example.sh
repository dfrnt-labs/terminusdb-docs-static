#!/bin/bash
# Documentation example: diff-swap-with-keep
# Source: src/app/docs/json-diff-and-patch/page.md:400
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

curl -X POST -H "Content-Type: application/json" 'http://localhost:6363/api/diff' -d \
  '{ "before" : { "asdf" : "foo", "fdsa" : "bar"}, "after" : { "asdf" : "bar", "fdsa" : "bar"}, "keep" : { "fdsa" : true}}'
