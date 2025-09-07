# DevTool - Development Tools

## Overview

This directory contains the web-based development and debugging tools for Guillotine. It provides an interactive graphical interface for EVM debugging, bytecode analysis, transaction tracing, and performance profiling. Built as a modern web application using SolidJS and TypeScript.

## Components

### Core Application Files
- **`main.zig`** - Zig integration and C bindings for EVM operations
- **`app.zig`** - Application logic and EVM interface
- **`evm.zig`** - EVM execution wrapper and debugging interface
- **`debug_state.zig`** - Debug state management and serialization

### Web Application
- **`package.json`** - Node.js dependencies and build scripts
- **`vite.config.ts`** - Vite build configuration
- **`tsconfig.json`** - TypeScript configuration
- **`index.html`** - Main HTML entry point

### Frontend Source (`solid/`)
- **Components** - Reusable UI components for debugging interface
- **Views** - Complete pages for different debugging modes
- **Utilities** - Helper functions and type definitions
- **Styles** - CSS and styling for the application

### Native Integration
- **`native_menu.swift`** - macOS native menu integration
- **`native_menu.h`** - C header for native functionality

### Build Output
- **`dist/`** - Built web application assets
- **`webui/`** - Additional web interface components

## Key Features

### Interactive EVM Debugger
- **Step-by-step execution** - Step through EVM bytecode instruction by instruction
- **Breakpoint support** - Set breakpoints at specific opcodes or program counters
- **State inspection** - View stack, memory, storage, and gas consumption in real-time
- **Call stack visualization** - Track function calls and contract interactions

### Bytecode Analysis
- **Disassembly view** - Human-readable representation of EVM bytecode
- **Control flow analysis** - Visual representation of jumps and branches
- **Gas cost analysis** - Detailed breakdown of gas consumption per operation
- **Optimization suggestions** - Identify potential gas optimization opportunities

### Transaction Tracing
- **Execution traces** - Complete trace of transaction execution
- **State diff visualization** - Before/after comparison of EVM state
- **Event log analysis** - Detailed view of emitted events and logs
- **Error diagnosis** - Comprehensive error reporting and debugging

### Performance Profiling
- **Execution timing** - Measure performance of individual operations
- **Memory usage tracking** - Monitor memory allocation and usage patterns
- **Gas usage optimization** - Identify expensive operations and suggest improvements
- **Benchmark comparisons** - Compare performance against reference implementations

## Architecture

### Multi-Layer Design
```
┌─────────────────────────┐
│   Web Frontend          │  ← SolidJS/TypeScript UI
├─────────────────────────┤
│   Native Integration    │  ← Platform-specific features
├─────────────────────────┤
│   Zig Application Layer │  ← Business logic and EVM interface
├─────────────────────────┤
│   Guillotine EVM Core   │  ← Core EVM implementation
└─────────────────────────┘
```

### Component Architecture
- **Reactive UI** - SolidJS provides efficient reactive updates
- **State Management** - Centralized state with proper synchronization
- **Native Bridge** - Seamless integration with platform features
- **Real-time Updates** - Live debugging with instant state updates

## Web Interface

### Main Views
1. **Debugger View** - Interactive debugging interface
2. **Trace View** - Transaction execution analysis
3. **Bytecode View** - Assembly-level code inspection
4. **State View** - EVM state visualization
5. **Performance View** - Profiling and benchmarking results

### Interactive Features
- **Responsive Design** - Works on different screen sizes
- **Keyboard shortcuts** - Efficient navigation and control
- **Export functionality** - Save traces and analysis results
- **Theme support** - Light and dark mode options

## Development Setup

### Prerequisites
```bash
# Install Node.js dependencies
npm install

# Install Zig build dependencies
zig build
```

### Development Server
```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Build native components
zig build devtool
```

### Build Process
1. **Frontend Build** - Vite bundles the web application
2. **Native Compilation** - Zig compiles the native components
3. **Asset Integration** - Web assets are embedded or linked
4. **Platform Packaging** - Final application is packaged for distribution

## Native Integration

### Platform Features
- **File System Access** - Open and save debugging sessions
- **Menu Integration** - Native menus for common operations  
- **Window Management** - Proper window handling and state persistence
- **System Notifications** - Progress updates and completion alerts

### Cross-Platform Support
- **macOS** - Native Cocoa integration with Swift
- **Linux** - GTK-based integration
- **Windows** - Win32 API integration

## Usage Patterns

### Debugging a Transaction
1. Load transaction hash or bytecode
2. Set breakpoints at points of interest
3. Step through execution while monitoring state
4. Analyze gas usage and performance metrics
5. Export results for further analysis

### Bytecode Analysis
1. Import contract bytecode or deployment transaction
2. View disassembled instructions with annotations
3. Analyze control flow and function boundaries
4. Identify optimization opportunities
5. Generate reports on gas efficiency

### Performance Profiling
1. Configure profiling parameters
2. Execute target code with instrumentation
3. Collect performance metrics and traces
4. Analyze bottlenecks and optimization opportunities
5. Compare against baseline measurements

## Configuration

### Debug Configuration
```json
{
  "tracing": {
    "level": "detailed",
    "includeMemory": true,
    "includeStorage": true,
    "gasTracking": true
  },
  "display": {
    "theme": "dark",
    "fontSize": 14,
    "showLineNumbers": true
  }
}
```

### Integration Settings
- **EVM parameters** - Gas limits, hardfork settings
- **Network settings** - RPC endpoints, chain configuration
- **UI preferences** - Theme, layout, keyboard shortcuts
- **Export options** - Output formats and destinations

## Security Considerations

### Sandboxing
- Web content is properly sandboxed
- Native code access is controlled and validated
- File system access is restricted to designated areas

### Data Handling
- Sensitive data (private keys) is handled securely
- Debug information is properly sanitized
- Network communications use secure protocols

## Extension Points

### Plugin Architecture
- Custom analysis plugins
- External tool integration
- Custom visualizations
- Report generators

### API Integration
- REST API for external tools
- WebSocket for real-time updates
- Integration with IDEs and editors
- Command-line interface compatibility