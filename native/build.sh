#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$ROOT_DIR/build"
APP_PATH="$BUILD_DIR/NotchScriptNative"
MODULE_CACHE="$BUILD_DIR/module-cache"

mkdir -p "$BUILD_DIR"
mkdir -p "$MODULE_CACHE"

swiftc \
  "$ROOT_DIR/Sources/main.swift" \
  -target arm64-apple-macosx14.0 \
  -module-cache-path "$MODULE_CACHE" \
  -framework AppKit \
  -framework WebKit \
  -o "$APP_PATH"

echo "Built $APP_PATH"
