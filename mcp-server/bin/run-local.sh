#!/usr/bin/env bash
# Ayyuhannas Fest MCP Server - Local stdio launcher
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$DIR"
exec node "$DIR/mcp-server/dist/index.js" --stdio
