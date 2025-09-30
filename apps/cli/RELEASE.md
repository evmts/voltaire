# Release Process for Guillotine CLI

This document describes the complete release process for publishing the Guillotine CLI to Homebrew.

## Prerequisites

### One-Time Setup

1. **Create Homebrew Tap Repository**

   Follow the instructions in [HOMEBREW_TAP_SETUP.md](./HOMEBREW_TAP_SETUP.md) to create and configure the `homebrew-tap` repository.

2. **Install Required Tools**

   ```bash
   # Install GoReleaser
   brew install goreleaser/tap/goreleaser

   # Or using Go
   go install github.com/goreleaser/goreleaser@latest

   # Verify installation
   goreleaser --version
   ```

3. **Configure GitHub Secrets**

   Add the following secrets to the main repository (`evmts/guillotine`):

   - `HOMEBREW_TAP_GITHUB_TOKEN`: Personal access token with `repo` and `write:packages` scopes

   See [HOMEBREW_TAP_SETUP.md](./HOMEBREW_TAP_SETUP.md#3-configure-github-token) for detailed instructions.

### Before Each Release

- [ ] All tests pass: `zig build test`
- [ ] CLI builds successfully: `zig build cli`
- [ ] Go dependencies are up to date: `cd apps/cli && go mod tidy`
- [ ] CHANGELOG is updated with release notes
- [ ] Version number is decided (semantic versioning)

## Release Methods

### Method 1: Automated Release (Recommended)

This method uses GitHub Actions to handle everything automatically.

#### Steps

1. **Update Version and Changelog**

   ```bash
   # Edit CHANGELOG.md
   vim CHANGELOG.md

   # Add your changes under a new version header
   # Example:
   # ## [1.0.0] - 2025-01-15
   # ### Added
   # - New feature X
   # ### Fixed
   # - Bug Y
   ```

2. **Commit Changes**

   ```bash
   git add .
   git commit -m "chore: prepare release v1.0.0"
   git push origin main
   ```

3. **Create and Push Tag**

   ```bash
   # Create annotated tag
   git tag -a v1.0.0 -m "Release v1.0.0"

   # Push tag to trigger release
   git push origin v1.0.0
   ```

4. **Monitor GitHub Actions**

   - Go to: `https://github.com/evmts/guillotine/actions`
   - Watch the "Release" workflow
   - It will:
     - Build Zig library for all platforms
     - Cross-compile Go CLI for macOS, Linux, Windows
     - Create GitHub release with binaries
     - Update Homebrew formula in `homebrew-tap`
     - Run installation tests

5. **Verify Release**

   ```bash
   # Check GitHub release
   open https://github.com/evmts/guillotine/releases

   # Verify Homebrew formula was updated
   open https://github.com/evmts/homebrew-tap/commits/main

   # Test installation
   brew tap evmts/tap
   brew install guillotine
   guil --version
   ```

### Method 2: Manual Release (Testing/Development)

Use this method for testing the release process locally without creating an actual release.

#### Steps

1. **Build Zig Library**

   ```bash
   # From repository root
   zig build -Doptimize=ReleaseFast
   ```

2. **Test GoReleaser Configuration**

   ```bash
   # From repository root
   cd apps/cli

   # Dry run - validates configuration
   goreleaser check

   # Snapshot release - builds without publishing
   goreleaser release --snapshot --clean

   # Check output in dist/
   ls -la dist/
   ```

3. **Test Using Zig Build Command**

   ```bash
   # From repository root
   zig build cli-goreleaser-test
   ```

4. **Test Built Binary**

   ```bash
   # Test the snapshot build
   ./dist/guillotine_darwin_arm64/guil --version
   ./dist/guillotine_darwin_arm64/guil --help
   ```

5. **If Everything Looks Good, Create Real Release**

   Follow Method 1 (Automated Release) to create the actual release.

## Release Workflow Details

### What Happens During a Release

1. **Zig Library Build** (GitHub Actions: `build-zig-lib` job)
   - Matrix build for multiple platforms:
     - macOS: aarch64, x86_64
     - Linux: aarch64, x86_64
   - Outputs: `libguillotine.dylib`, `libguillotine.so`, `libguillotine.a`
   - Artifacts uploaded for next job

2. **GoReleaser** (GitHub Actions: `goreleaser` job)
   - Downloads Zig library artifacts
   - Cross-compiles Go CLI for:
     - darwin/amd64, darwin/arm64
     - linux/amd64, linux/arm64
     - windows/amd64, windows/arm64
   - Creates release archives (`.tar.gz` for Unix, `.zip` for Windows)
   - Generates checksums
   - Creates GitHub release with binaries
   - Updates Homebrew formula in `homebrew-tap`

3. **Homebrew Formula Update** (Automatic)
   - Formula file: `Formula/guillotine.rb`
   - Updates version, URLs, and SHA256 checksums
   - Committed to `homebrew-tap` repository
   - Available immediately via `brew install`

4. **Testing** (GitHub Actions: `test-homebrew` job)
   - Installs from Homebrew tap
   - Runs smoke tests
   - Verifies CLI functionality

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes, backward compatible

Examples:
- `v1.0.0` - First stable release
- `v1.1.0` - Added new command
- `v1.1.1` - Fixed bug in existing command
- `v2.0.0` - Changed CLI API (breaking)

## Rollback Process

If a release has issues:

### Option 1: Quick Patch Release

```bash
# Fix the issue
git commit -m "fix: critical bug"

# Create patch release
git tag v1.0.1
git push origin v1.0.1
```

### Option 2: Revert Homebrew Formula

```bash
# Clone tap repository
git clone https://github.com/evmts/homebrew-tap.git
cd homebrew-tap

# Revert to previous version
git revert HEAD
git push origin main

# Users can now install previous version
brew update
brew reinstall guillotine
```

### Option 3: Delete Release (Last Resort)

```bash
# Delete tag locally
git tag -d v1.0.0

# Delete tag remotely
git push origin :refs/tags/v1.0.0

# Manually delete GitHub release
# Go to: https://github.com/evmts/guillotine/releases
# Click on the release, then "Delete"
```

## Troubleshooting

### GoReleaser Fails

**Problem**: GoReleaser validation errors

```bash
# Check configuration
goreleaser check

# Common issues:
# - Missing HOMEBREW_TAP_GITHUB_TOKEN secret
# - Invalid .goreleaser.yml syntax
# - Missing Git tag
```

**Solution**: Fix configuration errors shown in output

### Homebrew Formula Not Updating

**Problem**: Formula file not updated in tap repository

- Verify `HOMEBREW_TAP_GITHUB_TOKEN` secret exists and is valid
- Check token has correct permissions (`repo`, `write:packages`)
- Verify repository path in `.goreleaser.yml`: `owner/name`

### Cross-Compilation Fails

**Problem**: CGo compilation errors for specific platform

```bash
# Test specific platform locally
GOOS=linux GOARCH=arm64 CGO_ENABLED=1 CC=aarch64-linux-gnu-gcc go build
```

**Solution**: Install missing cross-compilation toolchains:

```bash
# Ubuntu/Debian
sudo apt-get install gcc-aarch64-linux-gnu g++-aarch64-linux-gnu

# macOS
brew install mingw-w64  # For Windows builds
```

### Installation Test Fails

**Problem**: `brew install guillotine` fails after release

```bash
# Check formula syntax
brew audit --strict --online Formula/guillotine.rb

# Test installation with verbose output
brew install --verbose --build-from-source guillotine
```

**Solution**: Common issues:
- Incorrect SHA256 checksum (GoReleaser should auto-calculate)
- Wrong download URL
- Missing dependencies in formula
- Library path issues (ensure `lib.install` includes Zig libraries)

## Best Practices

### Before Releasing

- [ ] Run full test suite
- [ ] Test CLI commands manually
- [ ] Update documentation
- [ ] Write clear release notes
- [ ] Test local GoReleaser build

### Release Notes

Good release notes include:

```markdown
## [1.0.0] - 2025-01-15

### Added
- New `guil trace` command for execution tracing
- Support for CREATE2 opcode
- JSON output format for all commands

### Changed
- Improved error messages for invalid addresses
- Updated to Zig 0.15.1

### Fixed
- Memory leak in bytecode analysis
- Gas calculation for SSTORE opcode

### Breaking Changes
- Removed deprecated `--legacy` flag
- Changed output format for `guil call` (use `--format=json` for old format)
```

### Communication

After release:

- Update documentation website
- Post on social media/Discord/forums
- Update examples to use new version
- Monitor for bug reports

## Testing Checklist

Before considering a release successful:

- [ ] GitHub release created with all binaries
- [ ] Checksums file present
- [ ] Homebrew formula updated in tap repository
- [ ] Formula passes `brew audit`
- [ ] CLI installs via Homebrew
- [ ] `guil --version` shows correct version
- [ ] All commands execute successfully
- [ ] Library paths work correctly
- [ ] Cross-platform builds present (macOS, Linux, Windows)

## Scheduled Releases

Consider establishing a release cadence:

- **Patch releases**: As needed for critical bugs
- **Minor releases**: Monthly (first Monday)
- **Major releases**: Quarterly or when breaking changes accumulate

## Appendix

### Files Involved in Release Process

```
Guillotine repository (evmts/guillotine):
├── .github/workflows/release.yml    # GitHub Actions workflow
├── apps/cli/
│   ├── .goreleaser.yml              # GoReleaser configuration
│   ├── build.zig                    # Build commands
│   ├── RELEASE.md                   # This file
│   └── HOMEBREW_TAP_SETUP.md        # Tap setup guide
└── CHANGELOG.md                      # Version history

Homebrew tap repository (evmts/homebrew-tap):
├── Formula/
│   └── guillotine.rb                # Auto-generated by GoReleaser
└── README.md
```

### Useful Commands

```bash
# Check GoReleaser configuration
goreleaser check

# Build release locally
goreleaser release --snapshot --clean

# Test Homebrew formula
brew audit --strict Formula/guillotine.rb
brew install --build-from-source Formula/guillotine.rb

# View release info
gh release view v1.0.0

# Download release assets
gh release download v1.0.0

# List all releases
gh release list

# Verify Zig build
zig build -Doptimize=ReleaseFast

# Build CLI release
zig build cli-release

# Test GoReleaser via Zig
zig build cli-goreleaser-test
```

### Support

- GitHub Issues: https://github.com/evmts/guillotine/issues
- Discussions: https://github.com/evmts/guillotine/discussions
- GoReleaser Docs: https://goreleaser.com/
- Homebrew Docs: https://docs.brew.sh/