#!/bin/bash

# ARCHITECTURAL CLASSIFICATION: Behavioral / Environment Setup
# WHY: Standardizes Playwright dependency injection on SteamOS/Arch.
# RISK REDUCED: Avoids path-not-found errors and ensures system-level libs are present.

echo "--- Scholonomance Environment Sync: Playwright ---"

# 1. Locate npx dynamically to avoid hard-coded paths
NPX_PATH=$(which npx)

if [ -z "$NPX_PATH" ]; then
    echo "FAIL: npx not found in current PATH. Ensure Node is installed."
    exit 1
fi

echo "Found npx at: $NPX_PATH"

# 2. Install Playwright system dependencies
echo "Installing system dependencies (requires sudo)..."

OS_ID=$(grep -E '^ID=' /etc/os-release 2>/dev/null | cut -d= -f2 | tr -d '"')
OS_LIKE=$(grep -E '^ID_LIKE=' /etc/os-release 2>/dev/null | cut -d= -f2 | tr -d '"')

if command -v pacman >/dev/null 2>&1 && { [ "$OS_ID" = "steamos" ] || [ "$OS_ID" = "arch" ] || echo "$OS_LIKE" | grep -q "arch"; }; then
    echo "Detected SteamOS/Arch; installing deps via pacman."
    sudo steamos-readonly disable
    sudo pacman-key --init
    sudo pacman-key --populate archlinux
    sudo pacman -Syu
    sudo pacman -S --needed icu harfbuzz-icu hyphen woff2 flite libmanette
else
    sudo env "PATH=$PATH" "$NPX_PATH" playwright install-deps
fi

# 3. Install the browser binaries
echo "Downloading browser binaries..."
"$NPX_PATH" playwright install

echo "--- Setup Complete ---"
