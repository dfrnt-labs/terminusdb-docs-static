#!/bin/bash

# Default values
ASSETS_DOMAIN="assets.terminusdb.com"
MAX_PAGES=100
DOWNLOAD_MEDIA=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --assets-domain)
      ASSETS_DOMAIN="$2"
      shift 2
      ;;
    --max-pages)
      MAX_PAGES="$2"
      shift 2
      ;;
    --download-media)
      DOWNLOAD_MEDIA=true
      shift
      ;;
    --help)
      echo "Usage: ./run-crawler.sh [options]"
      echo ""
      echo "Options:"
      echo "  --assets-domain <domain>   Set the assets domain (default: assets.terminusdb.com)"
      echo "                             Example: --assets-domain assets.terminusdb.io"
      echo "  --max-pages <number>       Set the maximum number of pages to crawl (default: 100)"
      echo "  --download-media           Download all media files from assets.terminusdb.com"
      echo "  --help                     Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help to see available options"
      exit 1
      ;;
  esac
done

# Create directory name for display
ASSETS_DIR_NAME=$(echo "$ASSETS_DOMAIN" | tr '.' '_')

# Ensure output directory exists
mkdir -p ./output

# Run the crawler with the specified assets domain
echo "Starting crawler with assets domain: $ASSETS_DOMAIN"
echo "Maximum pages to crawl: $MAX_PAGES"
if [ "$DOWNLOAD_MEDIA" = true ]; then
  echo "Media download: ENABLED"
  echo "- Media files will be saved to: output/$ASSETS_DIR_NAME"
else
  echo "Media download: DISABLED"
fi

# Run the crawler with the environment variables
ASSETS_DOMAIN=$ASSETS_DOMAIN DOWNLOAD_MEDIA=$DOWNLOAD_MEDIA MAX_PAGES=$MAX_PAGES npx bun crawl.js

echo "Crawler completed!"
echo "Output saved to: ./output/all_documents.json"
