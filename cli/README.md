# Synkrypt CLI

This package builds the `synkrypt` command-line tool.

## Local Development Install (Bun)

```bash
cd cli
bun install
bun link
```

Verify:

```bash
synkrypt --help
```

## Common CLI Commands

```bash
synkrypt login
synkrypt whoami
synkrypt use <project-key>
synkrypt pull --env dev
synkrypt run --env dev -- bun run dev
synkrypt logout
```

## Building Standalone Binaries

The CLI is compiled into standalone native executables using Bun’s `--compile`.

Build per platform:

```bash
cd cli

# macOS
bun run compile:darwin-arm64
bun run compile:darwin-x64

# Linux
bun run compile:linux-x64
bun run compile:linux-arm64

# Windows
bun run compile:windows-x64
```

### Linux Baseline Builds (Recommended)

Baseline targets are more broadly compatible across Linux distributions.

```bash
cd cli
bun run compile:linux-x64:baseline
bun run compile:linux-arm64:baseline
```

Or build everything (baseline Linux + macOS):

```bash
cd cli
bun run compile:all:baseline
```

## Packaging Release Assets (tar.gz + SHA256SUMS)

This creates GitHub Releases-friendly assets under `cli/release/`.

```bash
cd cli

# 1) Build the binaries first
bun run compile:all:baseline

# 2) Package into tarballs + checksums
bun run release:assets
```

Output:

- `cli/release/synkrypt-<os>-<arch>.tar.gz` (contains a single `synkrypt` binary)
- `cli/release/synkrypt-windows-x64.zip` (contains `synkrypt.exe`)
- `cli/release/SHA256SUMS.txt`

## Git Hygiene

Do not commit build artifacts. Add these paths to gitignore:

- `cli/bin/`
- `cli/release/`
