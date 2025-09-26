# Development Tools

A comprehensive web-based development environment for debugging and analyzing EVM execution in Guillotine.

## Overview

The devtool module provides a powerful graphical interface for EVM development, combining a modern web UI with the high-performance Guillotine EVM backend. It enables step-by-step debugging, state inspection, and real-time visualization of EVM execution.

## Components

### Core Files

- **`main.zig`** - Application entry point with platform-specific initialization
- **`app.zig`** - Main application logic and WebUI event handlers
- **`debug_state.zig`** - EVM state capture and serialization utilities
- **`evm.zig`** - Development-focused EVM wrapper with debugging capabilities

### WebUI Framework (`webui/`)

- **`webui.zig`** - Core WebUI bindings and window management
- **`event.zig`** - Event system for JavaScript-Zig communication
- **`binding.zig`** - Function binding utilities
- **`window.zig`** - Window management and display functions
- **`config.zig`** - WebUI configuration and settings
- **`javascript.zig`** - JavaScript execution interface
- **`file_handler.zig`** - Static file serving for web assets
- **`utils.zig`** - Utility functions for WebUI operations
- **`types.zig`** - Type definitions for WebUI integration
- **`flags.zig`** - Command-line and runtime flags

## Features

### EVM Debugging

- **Step-by-step execution** - Execute bytecode one instruction at a time
- **State inspection** - View stack, memory, storage, and gas consumption
- **Bytecode visualization** - Interactive bytecode display with PC tracking
- **Real-time updates** - Live state updates during execution

### Web Interface

- **Modern UI** - HTML5-based interface with responsive design
- **Real-time communication** - Bidirectional JavaScript-Zig messaging
- **Asset serving** - Embedded web assets for standalone deployment
- **Cross-platform** - Works on macOS, Linux, and Windows

### Development Utilities

- **Opcode mapping** - Complete opcode-to-string conversion
- **Memory formatting** - Hex visualization of memory contents
- **Stack serialization** - JSON-compatible stack representation
- **Error handling** - Comprehensive error capture and display

## Usage Examples

### Basic Usage

```zig
const std = @import("std");
const App = @import("app.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    var app = try App.init(allocator);
    defer app.deinit();
    
    try app.run();
}
```

### EVM State Inspection

```zig
const debug_state = @import("debug_state.zig");

// Capture current EVM state
const state = debug_state.DebugState.capture(
    pc,
    opcode,
    gas_remaining,
    depth,
    is_static,
    &stack,
    &memory,
    error_opt,
);

// Serialize for web frontend
const json = try evm.serializeEvmState();
defer allocator.free(json);
```

### Custom Event Handlers

```zig
fn customHandler(e: *webui.Event) void {
    const input = e.get_string();
    
    // Process input
    const result = processData(input);
    
    // Return JSON response
    var buffer: [512:0]u8 = undefined;
    const json = std.fmt.bufPrintZ(&buffer, 
        "{{\"result\": \"{s}\"}}", .{result}
    ) catch "{{\"error\": \"Processing failed\"}}";
    
    e.return_string(json);
}
```

## API Functions

### WebUI Event Handlers

- `helloWorldHandler()` - Test connectivity between frontend and backend
- `loadBytecodeHandler()` - Load and validate EVM bytecode
- `resetEvmHandler()` - Reset EVM state and return serialized state
- `stepEvmHandler()` - Execute one instruction and return updated state
- `getEvmStateHandler()` - Get current EVM state without execution

### Debug State Utilities

- `DebugState.capture()` - Capture complete EVM state snapshot
- `opcodeToString()` - Convert opcode byte to human-readable name
- `formatU256Hex()` - Format 256-bit integers as hex strings
- `serializeStack()` - Convert stack contents to JSON-compatible format
- `serializeMemory()` - Convert memory contents to hex string

## Important Considerations

### Memory Management

- **Automatic cleanup** - WebUI resources are cleaned up on app exit
- **JSON serialization** - All JSON strings must be freed by caller
- **State management** - EVM state is reset between debugging sessions

### Platform Support

- **macOS integration** - Native application menus and window management
- **Cross-platform WebUI** - Consistent interface across operating systems
- **Embedded assets** - All web assets embedded in binary for portability

### Performance

- **Real-time updates** - Optimized for responsive UI during step debugging
- **Memory efficiency** - Minimal memory overhead for state capture
- **Fast serialization** - Efficient JSON generation for large states

### Error Handling

- **Comprehensive error capture** - All EVM errors are caught and displayed
- **Graceful degradation** - UI remains functional even when EVM errors occur
- **User-friendly messages** - Technical errors are translated to readable format

## Development Workflow

1. **Initialize** - Create app instance with allocator
2. **Load bytecode** - Load EVM bytecode through web interface
3. **Step execution** - Execute instructions one at a time
4. **Inspect state** - Examine stack, memory, and storage changes
5. **Analyze results** - Use visualization tools to understand execution

The devtool module is essential for EVM development, providing the visibility and control needed to understand complex bytecode execution patterns and debug smart contracts effectively.

## Build Notes

- The Zig build integrates asset generation: `npm install && npm run build` under `apps/devtool/`, then embeds the produced assets into a Zig module. Running the devtool from the project root via `zig build` generates assets automatically when needed.
- All web assets live in `apps/devtool/public` and compiled output in `apps/devtool/dist`.
