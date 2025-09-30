# Quick Start - Publishing to Homebrew

This is a condensed guide to get your CLI published to Homebrew as quickly as possible.

## Prerequisites (5 minutes)

```bash
# Install GoReleaser
brew install goreleaser/tap/goreleaser

# Verify tools
go version      # Should be >= 1.25
zig version     # Should be 0.15.1
goreleaser --version
```

## Setup Homebrew Tap (10 minutes)

### 1. Create Repository

Go to GitHub and create a **new public repository**:
- **Name**: `homebrew-tap`
- **Owner**: `evmts` (your organization)
- **Initialize**: ✅ Add README

### 2. Initialize Repository

```bash
# Clone the new repository
git clone https://github.com/evmts/homebrew-tap.git
cd homebrew-tap

# Create Formula directory
mkdir -p Formula

# Create placeholder formula
cat > Formula/guillotine.rb << 'EOF'
class Guillotine < Formula
  desc "High-performance EVM implementation CLI tool"
  homepage "https://github.com/evmts/guillotine"
  version "0.0.0"

  def install
    bin.install "guil"
  end

  test do
    system "#{bin}/guil", "--version"
  end
end
EOF

# Commit and push
git add .
git commit -m "Initial tap structure"
git push origin main
```

### 3. Create GitHub Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name: `GoReleaser Homebrew Tap`
4. Select scopes:
   - ✅ `repo` (all)
   - ✅ `write:packages`
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)

### 4. Add Token to Secrets

1. Go to: `https://github.com/evmts/guillotine/settings/secrets/actions`
2. Click **"New repository secret"**
3. Name: `HOMEBREW_TAP_GITHUB_TOKEN`
4. Paste the token
5. Click **"Add secret"**

## Test Release Locally (5 minutes)

```bash
# Navigate to CLI directory
cd /path/to/Guillotine/apps/cli

# Run pre-release checks
make release-check

# Test local build
make release-local

# Verify artifacts
ls -lh dist/
```

## Create First Release (2 minutes)

### Option A: Automated (Recommended)

```bash
# From repository root
cd /path/to/Guillotine

# Create and push tag
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0

# Monitor GitHub Actions
# Go to: https://github.com/evmts/guillotine/actions
```

### Option B: Using Make

```bash
# From apps/cli directory
cd apps/cli

# Interactive release
make release
# Follow the prompts to enter version and confirm
```

## Verify Release (3 minutes)

### 1. Check GitHub Release

```bash
# Open releases page
open https://github.com/evmts/guillotine/releases

# Should see v0.1.0 with binaries:
# - guillotine_0.1.0_darwin_arm64.tar.gz
# - guillotine_0.1.0_darwin_x86_64.tar.gz
# - guillotine_0.1.0_linux_arm64.tar.gz
# - guillotine_0.1.0_linux_x86_64.tar.gz
# - checksums.txt
```

### 2. Check Homebrew Formula

```bash
# Open tap repository
open https://github.com/evmts/homebrew-tap/commits/main

# Should see new commit from goreleaser-bot updating Formula/guillotine.rb
```

### 3. Test Installation

```bash
# Add tap
brew tap evmts/tap

# Install
brew install guillotine

# Verify
guil --version  # Should show v0.1.0
guil --help
```

## Done! 🎉

Your CLI is now published to Homebrew. Users can install it with:

```bash
brew tap evmts/tap
brew install guillotine
```

## Next Release

Future releases are even simpler:

```bash
# Make your changes, commit them

# Create new release
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0

# That's it! GitHub Actions handles the rest.
```

## Troubleshooting

### Release Fails

```bash
# Check GitHub Actions logs
open https://github.com/evmts/guillotine/actions

# Common issues:
# - Missing HOMEBREW_TAP_GITHUB_TOKEN secret
# - Token expired or has wrong permissions
# - Build errors in Zig or Go
```

### Installation Fails

```bash
# Test formula locally
brew audit --strict --online Formula/guillotine.rb

# Install with verbose output
brew install --verbose --build-from-source guillotine
```

### Token Issues

```bash
# Verify secret exists
gh secret list  # Using GitHub CLI

# Or check manually:
# Go to: https://github.com/evmts/guillotine/settings/secrets/actions
```

## Need More Details?

- Full setup guide: [HOMEBREW_TAP_SETUP.md](./HOMEBREW_TAP_SETUP.md)
- Release process: [RELEASE.md](./RELEASE.md)
- Development: [README.md](./README.md)

## Support

- Issues: https://github.com/evmts/guillotine/issues
- GoReleaser Docs: https://goreleaser.com/
- Homebrew Docs: https://docs.brew.sh/