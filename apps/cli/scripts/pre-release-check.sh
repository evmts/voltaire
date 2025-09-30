#!/usr/bin/env bash
# Pre-release checks for Guillotine CLI
# Run this script before creating a release tag

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}==>${NC} ${1}"
}

print_success() {
    echo -e "${GREEN}✓${NC} ${1}"
}

print_error() {
    echo -e "${RED}✗${NC} ${1}"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} ${1}"
}

# Track failures
FAILURES=0

# Change to repository root
cd "$(dirname "$0")/../../.."

print_header "Pre-Release Checks for Guillotine CLI"

# Check 1: Verify Git status
print_header "Checking Git status"
if [[ -n $(git status --porcelain) ]]; then
    print_warning "Working directory has uncommitted changes"
    git status --short
    FAILURES=$((FAILURES + 1))
else
    print_success "Working directory is clean"
fi

# Check 2: Verify we're on main branch
print_header "Checking Git branch"
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    print_warning "Not on main branch (current: $CURRENT_BRANCH)"
    echo "  Releases should typically be from main branch"
    FAILURES=$((FAILURES + 1))
else
    print_success "On main branch"
fi

# Check 3: Verify submodules
print_header "Checking Git submodules"
if git submodule status | grep -q '^-'; then
    print_error "Git submodules not initialized"
    echo "  Run: git submodule update --init --recursive"
    FAILURES=$((FAILURES + 1))
else
    print_success "Git submodules initialized"
fi

# Check 4: Check required tools
print_header "Checking required tools"

check_tool() {
    if command -v "$1" &> /dev/null; then
        print_success "$1 installed ($(command -v "$1"))"
        return 0
    else
        print_error "$1 not found"
        return 1
    fi
}

check_tool "zig" || FAILURES=$((FAILURES + 1))
check_tool "go" || FAILURES=$((FAILURES + 1))
check_tool "goreleaser" || FAILURES=$((FAILURES + 1))

# Check 5: Verify Go version
print_header "Checking Go version"
GO_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
REQUIRED_GO_VERSION="1.25"
if [[ "$GO_VERSION" < "$REQUIRED_GO_VERSION" ]]; then
    print_error "Go version $GO_VERSION is too old (required: >=$REQUIRED_GO_VERSION)"
    FAILURES=$((FAILURES + 1))
else
    print_success "Go version $GO_VERSION"
fi

# Check 6: Verify Zig version
print_header "Checking Zig version"
ZIG_VERSION=$(zig version)
REQUIRED_ZIG_VERSION="0.15.1"
if [[ "$ZIG_VERSION" != "$REQUIRED_ZIG_VERSION" ]]; then
    print_warning "Zig version $ZIG_VERSION (recommended: $REQUIRED_ZIG_VERSION)"
fi
print_success "Zig version $ZIG_VERSION"

# Check 7: Build Zig library
print_header "Building Zig library"
if zig build -Doptimize=ReleaseFast &> /tmp/zig-build.log; then
    print_success "Zig library builds successfully"
else
    print_error "Zig library build failed"
    cat /tmp/zig-build.log
    FAILURES=$((FAILURES + 1))
fi

# Check 8: Build Go CLI
print_header "Building Go CLI"
cd apps/cli
if go mod tidy && go build -v . &> /tmp/go-build.log; then
    print_success "Go CLI builds successfully"
else
    print_error "Go CLI build failed"
    cat /tmp/go-build.log
    FAILURES=$((FAILURES + 1))
fi
cd ../..

# Check 9: Run tests
print_header "Running tests"
if zig build test &> /tmp/zig-test.log; then
    print_success "Zig tests pass"
else
    print_error "Zig tests failed"
    cat /tmp/zig-test.log
    FAILURES=$((FAILURES + 1))
fi

# Check 10: Verify GoReleaser configuration
print_header "Checking GoReleaser configuration"
cd apps/cli
if goreleaser check &> /tmp/goreleaser-check.log; then
    print_success "GoReleaser configuration is valid"
else
    print_error "GoReleaser configuration is invalid"
    cat /tmp/goreleaser-check.log
    FAILURES=$((FAILURES + 1))
fi
cd ../..

# Check 11: Verify GitHub token
print_header "Checking GitHub secrets"
if [[ -z "${HOMEBREW_TAP_GITHUB_TOKEN:-}" ]] && [[ -z "${GITHUB_TOKEN:-}" ]]; then
    print_warning "HOMEBREW_TAP_GITHUB_TOKEN not set (required for actual release)"
    echo "  This is OK for testing, but real releases need this token"
    echo "  Add it to GitHub repository secrets"
fi

# Check 12: Check CHANGELOG
print_header "Checking CHANGELOG"
if [[ ! -f "CHANGELOG.md" ]]; then
    print_warning "CHANGELOG.md not found"
    echo "  Consider creating a CHANGELOG to document releases"
elif ! grep -q "## \[" CHANGELOG.md; then
    print_warning "CHANGELOG.md exists but has no version entries"
    echo "  Add release notes before creating a release"
else
    print_success "CHANGELOG.md exists with version entries"
fi

# Check 13: Test GoReleaser snapshot build
print_header "Testing GoReleaser snapshot build"
cd apps/cli
if goreleaser release --snapshot --clean --skip=publish &> /tmp/goreleaser-snapshot.log; then
    print_success "GoReleaser snapshot build succeeded"

    # Verify artifacts
    if [[ -d "dist" ]]; then
        ARTIFACT_COUNT=$(find dist -type f -name "*.tar.gz" -o -name "*.zip" | wc -l)
        print_success "Created $ARTIFACT_COUNT release archives"
    fi
else
    print_error "GoReleaser snapshot build failed"
    tail -50 /tmp/goreleaser-snapshot.log
    FAILURES=$((FAILURES + 1))
fi
cd ../..

# Check 14: Verify library artifacts
print_header "Checking library artifacts"
if [[ -f "zig-out/lib/libguillotine.dylib" ]] || [[ -f "zig-out/lib/libguillotine.so" ]]; then
    print_success "Zig library artifacts present"
else
    print_error "Zig library artifacts not found"
    FAILURES=$((FAILURES + 1))
fi

# Summary
print_header "Summary"
if [[ $FAILURES -eq 0 ]]; then
    echo -e "${GREEN}All checks passed!${NC}"
    echo ""
    echo "Ready to create a release:"
    echo "  1. Commit any remaining changes"
    echo "  2. Create a tag: git tag -a v1.0.0 -m 'Release v1.0.0'"
    echo "  3. Push the tag: git push origin v1.0.0"
    echo "  4. GitHub Actions will handle the rest"
    echo ""
    exit 0
else
    echo -e "${RED}$FAILURES check(s) failed${NC}"
    echo ""
    echo "Please fix the issues above before creating a release"
    echo ""
    exit 1
fi