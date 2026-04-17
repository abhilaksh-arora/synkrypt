#!/bin/bash

# --- Synkrypt CLI Installer ---
# This script installs the Synkrypt binary globally.

set -e

# ANSI Color Codes
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "  ____              _                      _   "
echo " / ___| _   _ _ __ | | ___ __ _   _ _ __  | |_ "
echo " \___ \| | | | '_ \| |/ / '__| | | | '_ \ | __|"
echo "  ___) | |_| | | | |   <| |  | |_| | |_) || |_ "
echo " |____/ \__, |_| |_|_|\_\_|   \__, | .__/  \__|"
echo "        |___/                 |___/|_|         "
echo -e "  The Zero-Trust Secrets Manager${NC}\n"

# 1. Detect OS and Architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

case "${OS}" in
    Linux)
        OS_NAME="linux"
        ;;
    Darwin)
        OS_NAME="macos"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        echo -e "${RED}Error: This installer is for macOS/Linux.${NC}"
        echo -e "On Windows, run this in PowerShell instead:"
        echo -e "${BLUE}  irm https://synkrypt.abhilaksharora.com/install.ps1 | iex${NC}"
        exit 1
        ;;
    *)
        echo -e "${RED}Error: Unsupported OS ${OS}${NC}"
        exit 1
        ;;
esac

case "${ARCH}" in
    x86_64)
        ARCH_NAME="x64"
        ;;
    arm64|aarch64)
        ARCH_NAME="arm64"
        ;;
    *)
        echo -e "${RED}Error: Unsupported Architecture ${ARCH}${NC}"
        exit 1
        ;;
esac

ARCHIVE_NAME="synkrypt-${OS_NAME}-${ARCH_NAME}.tar.xz"
DOWNLOAD_URL="https://github.com/abhilaksh-arora/synkrypt/releases/latest/download/${ARCHIVE_NAME}"

# 2. Preparation
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT
cd "${TMP_DIR}"

echo -e "Downloading Synkrypt for ${OS_NAME} (${ARCH_NAME})..."

# 3. Download
if command -v curl >/dev/null 2>&1; then
    if ! curl -fL --progress-bar -o synkrypt.tar.xz "${DOWNLOAD_URL}"; then
        echo -e "${RED}Error: Download failed with curl. The binary might not be released yet.${NC}"
        echo -e "Visit: https://github.com/abhilaksh-arora/synkrypt/releases"
        exit 1
    fi
elif command -v wget >/dev/null 2>&1; then
    if ! wget -q --show-progress -O synkrypt.tar.xz "${DOWNLOAD_URL}"; then
        echo -e "${RED}Error: Download failed with wget. The binary might not be released yet.${NC}"
        echo -e "Visit: https://github.com/abhilaksh-arora/synkrypt/releases"
        exit 1
    fi
else
    echo -e "${RED}Error: Neither curl nor wget found. Please install one of them to continue.${NC}"
    exit 1
fi

echo -e "Extracting Synkrypt..."
tar -xf synkrypt.tar.xz
rm synkrypt.tar.xz
chmod +x synkrypt

# 4. Install
echo -e "Installing to /usr/local/bin..."
if [ -w /usr/local/bin ]; then
    mv synkrypt /usr/local/bin/synkrypt
else
    echo -e "${BLUE}Notice: Need sudo permissions to install to /usr/local/bin${NC}"
    sudo mv synkrypt /usr/local/bin/synkrypt
fi

# 5. Cleanup
cd - > /dev/null
# TMP_DIR is automatically removed by the trap

echo -e "\n${GREEN}Synkrypt CLI installed successfully!${NC}"
echo -e "Try it out by running: ${BLUE}synkrypt --help${NC}\n"
