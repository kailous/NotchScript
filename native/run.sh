#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_PATH="$ROOT_DIR/build/NotchScriptNative"

if [[ ! -x "$APP_PATH" ]]; then
  "$ROOT_DIR/build.sh"
fi

"$APP_PATH"
