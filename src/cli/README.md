# CLI - Command-Line Interface

## Overview

This directory contains the command-line interface for Guillotine, implemented in Go. The CLI provides a user-friendly interface for interacting with the Guillotine EVM implementation, debugging blockchain transactions, and analyzing EVM execution.

## Components

### Core Files
- **`main.go`** - Entry point for the CLI application
- **`go.mod`** - Go module definition with dependencies
- **`go.sum`** - Dependency checksums
- **`CLAUDE.md`** - AI assistant context and development guidelines
- **`guillotine-cli`** - Compiled CLI binary
- **`evm-debugger`** - EVM debugging tool binary

### Directory Structure
- **`internal/`** - Internal CLI components and modules
  - `app/` - Application logic and models
  - `config/` - Configuration management
  - `ui/` - User interface components

## Features

The CLI provides functionality for:

- **Transaction Analysis** - Analyze and debug Ethereum transactions
- **EVM Execution** - Run EVM bytecode with detailed execution traces
- **State Inspection** - Examine EVM state changes during execution
- **Performance Profiling** - Measure and analyze EVM performance
- **Interactive Debugging** - Step through EVM execution with breakpoints

## Usage

### Building the CLI
```bash
# Build from the CLI directory
go build -o guillotine-cli

# Or use the project's build system
zig build build-cli
```

### Running the CLI
```bash
# Basic usage
./guillotine-cli [command] [options]

# Debug a transaction
./guillotine-cli debug --tx-hash 0x... --rpc-url https://...

# Analyze bytecode
./guillotine-cli analyze --bytecode 0x608060405...
```

## Architecture

The CLI is built using a modular architecture:

1. **Command Router** - Handles command parsing and routing
2. **Internal Modules** - Business logic separated into internal packages
3. **UI Components** - Reusable interface elements for consistent presentation
4. **Configuration** - Centralized configuration management
5. **Integration Layer** - Interfaces with the core Guillotine EVM

## Dependencies

Key Go dependencies include:
- Terminal UI libraries for interactive interfaces
- HTTP clients for blockchain data retrieval
- JSON-RPC clients for Ethereum node communication
- Formatting and display utilities

## Development Guidelines

- Follow the patterns established in `CLAUDE.md`
- Maintain clear separation between UI, business logic, and data access
- Use the internal package structure to organize functionality
- Ensure all commands have comprehensive help text and examples
- Test CLI functionality with both unit tests and integration tests

## Integration

The CLI integrates with the core Guillotine EVM through:
- CGO bindings for performance-critical operations
- JSON-based configuration for EVM parameters
- File-based input/output for large datasets
- Direct memory sharing for real-time debugging

## Configuration

The CLI supports various configuration methods:
- Command-line flags and arguments
- Environment variables
- Configuration files (JSON/YAML)
- Interactive prompts for sensitive data

See the `internal/config/` directory for detailed configuration options.