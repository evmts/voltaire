# Makefile for Guillotine CLI
# Provides convenient commands for development and release

.PHONY: help build install test clean release-check release-local release deps fmt lint dev

# Default target
help:
	@echo "Guillotine CLI - Build Commands"
	@echo ""
	@echo "Development:"
	@echo "  make build         - Build the CLI binary"
	@echo "  make install       - Build and install to zig-out/bin"
	@echo "  make test          - Run tests"
	@echo "  make dev           - Run in development mode"
	@echo "  make clean         - Clean build artifacts"
	@echo ""
	@echo "Dependencies:"
	@echo "  make deps          - Update Go dependencies"
	@echo "  make fmt           - Format Go code"
	@echo "  make lint          - Lint Go code"
	@echo ""
	@echo "Release:"
	@echo "  make release-check - Run pre-release checks"
	@echo "  make release-local - Test release build locally"
	@echo "  make release       - Create and push release tag (interactive)"
	@echo ""
	@echo "Integration:"
	@echo "  make zig-build     - Build Zig library"
	@echo "  make zig-test      - Run Zig tests"
	@echo ""

# Development targets
build:
	@echo "Building CLI..."
	@cd ../.. && zig build cli

install:
	@echo "Installing CLI..."
	@cd ../.. && zig build cli-install

test:
	@echo "Running Go tests..."
	go test ./... -v

dev:
	@echo "Running in development mode..."
	@cd ../.. && zig build cli-dev

clean:
	@echo "Cleaning build artifacts..."
	rm -f guillotine-cli guil
	rm -rf dist
	@cd ../.. && zig build cli-clean

# Dependency management
deps:
	@echo "Updating dependencies..."
	go mod tidy
	go mod download

fmt:
	@echo "Formatting code..."
	go fmt ./...

lint:
	@echo "Linting code..."
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run; \
	else \
		echo "golangci-lint not installed. Install with:"; \
		echo "  go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; \
	fi

# Zig integration
zig-build:
	@echo "Building Zig library..."
	@cd ../.. && zig build -Doptimize=ReleaseFast

zig-test:
	@echo "Running Zig tests..."
	@cd ../.. && zig build test

# Release targets
release-check: zig-build
	@echo "Running pre-release checks..."
	@./scripts/pre-release-check.sh

release-local: release-check
	@echo "Testing release build locally..."
	@if ! command -v goreleaser >/dev/null 2>&1; then \
		echo "Error: goreleaser not installed"; \
		echo "Install with: brew install goreleaser/tap/goreleaser"; \
		exit 1; \
	fi
	goreleaser release --snapshot --clean
	@echo ""
	@echo "Release artifacts created in dist/"
	@ls -lh dist/*.tar.gz dist/*.zip 2>/dev/null || true

release: release-check
	@echo ""
	@echo "Ready to create a release!"
	@echo ""
	@read -p "Enter version (e.g., 1.0.0): " VERSION; \
	if [ -z "$$VERSION" ]; then \
		echo "Error: Version required"; \
		exit 1; \
	fi; \
	TAG="v$$VERSION"; \
	echo ""; \
	echo "This will:"; \
	echo "  1. Create tag: $$TAG"; \
	echo "  2. Push to GitHub"; \
	echo "  3. Trigger release workflow"; \
	echo ""; \
	read -p "Continue? (y/N): " CONFIRM; \
	if [ "$$CONFIRM" != "y" ] && [ "$$CONFIRM" != "Y" ]; then \
		echo "Release cancelled"; \
		exit 1; \
	fi; \
	git tag -a "$$TAG" -m "Release $$TAG"; \
	git push origin "$$TAG"; \
	echo ""; \
	echo "Release $$TAG created and pushed!"; \
	echo "Monitor progress at: https://github.com/evmts/guillotine/actions"

# CI simulation (run what CI will run)
ci: deps zig-build build test release-local
	@echo ""
	@echo "CI simulation completed successfully"