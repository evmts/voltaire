# Ethereum DevTool Boilerplate

This directory contains boilerplate code for building an Ethereum development tool as a native desktop application using Zig and WebUI.

## Overview

This is a starting point for creating native Ethereum development tools that:
- Run as lightweight desktop applications
- Use web technologies (HTML/CSS/JS) for the UI
- Keep application logic in Zig for performance and safety
- Leverage the system's existing browser (no embedded browser engine)

## Architecture

The devtool uses the WebUI library to create native desktop applications with web-based UIs:
- **Frontend**: HTML/CSS/JavaScript running in the user's browser
- **Backend**: Zig code with access to the full Ethereum client library
- **Communication**: Two-way binding between Zig functions and JavaScript

## Features

- Access to all Guillotine EVM functionality
- Direct integration with primitives (Address, RLP, etc.)
- Future provider package integration for RPC functionality
- Native performance with web UI flexibility
- Cross-platform support (Windows, macOS, Linux)

## Getting Started

### Building

```bash
zig build devtool
```

### Running

```bash
zig build run-devtool
```

Or after building:
```bash
./zig-out/bin/devtool
```

## Structure

```
src/devtool/
├── main.zig          # Entry point and WebUI setup
├── webui/            # WebUI library (forked and customized)
└── README.md         # This file
```

## Example Use Cases

This boilerplate can be extended to build:
- **Transaction Debuggers**: Step through EVM execution with a visual interface
- **Gas Analyzers**: Profile and optimize smart contract gas usage
- **Block Explorers**: Local block exploration tools
- **Contract Deployment Tools**: Visual contract deployment and management
- **Testing Dashboards**: Run and visualize EVM tests
- **State Inspectors**: Examine blockchain state changes
- **Development Wallets**: Custom wallet implementations for testing

## Extending the DevTool

1. **Add UI**: Modify the HTML/CSS in `main.zig` or serve from files
2. **Add Functionality**: Bind Zig functions to handle UI events
3. **Integrate EVM**: Use the Guillotine library for blockchain operations
4. **Add RPC**: When the provider package is ready, add network connectivity

## WebUI Features

The included WebUI library provides:
- Lightweight native windows (uses system browser)
- Two-way JavaScript ↔ Zig communication
- Automatic type conversion for function parameters
- File serving with custom handlers
- Multi-client support
- Cross-platform compatibility

## Example Code

```zig
// Bind a Zig function to JavaScript
fn analyzeGas(bytecode: [:0]const u8, e: *webui.Event) void {
    // Use Guillotine EVM to analyze gas
    const gas_cost = analyzeContractGas(bytecode);
    e.returnInt(gas_cost);
}

// In main()
try window.binding("analyzeGas", analyzeGas);
```

```javascript
// Call from JavaScript
const gasCost = await webui.analyzeGas(contractBytecode);
```

## Future Enhancements

As the Guillotine project evolves, this devtool boilerplate will gain:
- Full provider package integration for mainnet/testnet access
- ABI encoding/decoding for contract interactions
- Transaction building and signing
- Event monitoring and filtering
- ENS resolution
- L2/rollup support

## Contributing

When building tools with this boilerplate:
1. Follow the Zig coding standards in CLAUDE.md
2. Keep the UI minimal and focused
3. Leverage Guillotine's capabilities
4. Write comprehensive tests
5. Document your tool's purpose and usage

This boilerplate provides the foundation for building powerful, native Ethereum development tools with modern web UIs while maintaining the performance and safety benefits of Zig.
