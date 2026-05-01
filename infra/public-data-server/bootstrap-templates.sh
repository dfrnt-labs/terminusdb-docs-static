#!/bin/bash
set -e

TDB="/app/terminusdb/terminusdb"
TEMPLATE_DIR="/app/terminusdb/templates"

echo "Creating public user..."
$TDB user create public --password public 2>/dev/null 
$TDB user password admin --password `openssl rand -base64 32` 2>/dev/null

echo "Creating public organization..."
$TDB organization create public 2>/dev/null

# --- Star Wars database ---
echo "Creating public/star-wars database..."
$TDB db create public/star-wars \
  --label "Star Wars" \
  --comment "Star Wars demo dataset — characters, planets, films, species, vehicles, starships" \
  --public \
  --schema

if [ -f "$TEMPLATE_DIR/star-wars/schema.json" ] && [ -s "$TEMPLATE_DIR/star-wars/schema.json" ]; then
    echo "Loading star-wars schema..."
    $TDB doc insert public/star-wars --graph_type=schema \
      < "$TEMPLATE_DIR/star-wars/schema.json"
fi

if [ -f "$TEMPLATE_DIR/star-wars/data.json" ] && [ -s "$TEMPLATE_DIR/star-wars/data.json" ]; then
    echo "Loading star-wars data..."
    $TDB doc insert public/star-wars \
      < "$TEMPLATE_DIR/star-wars/data.json"
fi

# --- E-Commerce database ---
echo "Creating public/ecommerce database..."
$TDB db create public/ecommerce \
  --label "E-Commerce Demo" \
  --comment "E-commerce dataset — customers, products, orders, categories" \
  --public \
  --schema

if [ -f "$TEMPLATE_DIR/ecommerce/schema.json" ] && [ -s "$TEMPLATE_DIR/ecommerce/schema.json" ]; then
    echo "Loading ecommerce schema..."
    $TDB doc insert public/ecommerce --graph_type=schema \
      < "$TEMPLATE_DIR/ecommerce/schema.json"
fi

if [ -f "$TEMPLATE_DIR/ecommerce/data.json" ] && [ -s "$TEMPLATE_DIR/ecommerce/data.json" ]; then
    echo "Loading ecommerce data..."
    $TDB doc insert public/ecommerce \
      < "$TEMPLATE_DIR/ecommerce/data.json"
fi

# --- Nuclear database (from bundle) ---
BUNDLE_DIR="/app/terminusdb/templates/bundles"

if [ -f "$BUNDLE_DIR/admin%2fnuclear.bundle" ]; then
    echo "Creating public/nuclear database..."
    $TDB db create public/nuclear \
      --label "Nuclear Power Plants" \
      --comment "World nuclear power plant data — reactors, locations, capacity" \
      --public \
      --schema
    echo "Loading nuclear data from bundle..."
    $TDB unbundle public/nuclear "$BUNDLE_DIR/admin%2fnuclear.bundle"
fi

# --- Lego database (from bundle) ---
if [ -f "$BUNDLE_DIR/admin%2flego.bundle" ]; then
    echo "Creating public/lego database..."
    $TDB db create public/lego \
      --label "Lego Sets" \
      --comment "Lego sets, themes, parts, and colours dataset" \
      --public \
      --schema
    echo "Loading lego data from bundle..."
    $TDB unbundle public/lego "$BUNDLE_DIR/admin%2flego.bundle"
fi

# --- Sandbox database (docs examples target) ---
echo "Creating public/sandbox database..."
$TDB db create public/sandbox \
  --label "Sandbox" \
  --comment "Minimal docs sandbox — Product schema for branch, diff, merge, and time-travel examples" \
  --public \
  --schema

if [ -f "$TEMPLATE_DIR/sandbox/schema.json" ] && [ -s "$TEMPLATE_DIR/sandbox/schema.json" ]; then
    echo "Loading sandbox schema..."
    $TDB doc insert public/sandbox --graph_type=schema \
      < "$TEMPLATE_DIR/sandbox/schema.json"
fi

if [ -f "$TEMPLATE_DIR/sandbox/data.json" ] && [ -s "$TEMPLATE_DIR/sandbox/data.json" ]; then
    echo "Loading sandbox data..."
    $TDB doc insert public/sandbox \
      < "$TEMPLATE_DIR/sandbox/data.json"
fi

echo "Creating public/sandbox/local/branch/feature branch..."
$TDB branch create public/sandbox/local/branch/feature \
  --origin public/sandbox/local/branch/main

# Apply changes to the feature branch so diff/merge/time-travel examples have
# something to show when users clone and compare branches:
#   - Reduced price on Wireless Noise-Cancelling Headphones (299.99 → 249.99)
#   - New product Smart Home Hub (only on feature branch)
echo "Applying feature branch changes..."
printf '{"@id":"Product/Wireless%%20Noise-Cancelling%%20Headphones","@type":"Product","name":"Wireless Noise-Cancelling Headphones","price":249.99,"category":"Electronics"}\n' | \
  $TDB doc replace public/sandbox/local/branch/feature
printf '{"@type":"Product","name":"Smart Home Hub","price":79.99,"category":"Electronics"}\n' | \
  $TDB doc insert public/sandbox/local/branch/feature

# --- Capability grants (required for anonymous/public access) ---
# The --public flag does not create Role/consumer in fresh TerminusDB 12.x instances.
# We create a minimal cloner role (clone + commit_read_access) — tutorials only need
# to clone from this server; all subsequent reads hit the user's localhost.

echo "Creating cloner role..."
$TDB role create cloner clone commit_read_access

echo "Granting capabilities to public user..."
$TDB capability grant public public/star-wars cloner
$TDB capability grant public public/ecommerce cloner
$TDB capability grant public public/nuclear cloner
$TDB capability grant public public/lego cloner
$TDB capability grant public public/sandbox cloner
$TDB capability grant public public cloner --scope-type organization

echo "Granting capabilities to anonymous user..."
$TDB capability grant anonymous public/star-wars cloner
$TDB capability grant anonymous public/ecommerce cloner
$TDB capability grant anonymous public/nuclear cloner
$TDB capability grant anonymous public/lego cloner
$TDB capability grant anonymous public/sandbox cloner
$TDB capability grant anonymous public cloner --scope-type organization

echo "---"
echo "Template databases bootstrapped successfully."
echo "  - public/star-wars (public, anonymous clone enabled)"
echo "  - public/ecommerce (public, anonymous clone enabled)"
echo "  - public/nuclear (public, anonymous clone enabled)"
echo "  - public/lego (public, anonymous clone enabled)"
echo "  - public/sandbox (public, anonymous clone enabled — docs examples target)"
echo ""
echo "Clone with:"
echo "  terminusdb clone https://data.terminusdb.org/public/star-wars --token=anonymous"
echo "  terminusdb clone https://data.terminusdb.org/public/ecommerce --token=anonymous"
echo "  terminusdb clone https://data.terminusdb.org/public/nuclear --token=anonymous"
echo "  terminusdb clone https://data.terminusdb.org/public/lego --token=anonymous"
echo "  terminusdb clone https://data.terminusdb.org/public/sandbox --token=anonymous"
