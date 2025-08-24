# EVM Debugger CLI

A sophisticated terminal-based EVM debugger built with Go and Bubble Tea, designed to work with the Guillotine EVM interpreter. Features a professional multi-panel interface for real-time EVM execution analysis.

## 🎯 Features

### Enhanced Implementation (v0.2)
- **Multi-panel TUI** - Bytecode, stack, memory, Solidity source, profiling, and help views
- **Solidity Source Mapping** - Shows original Solidity code corresponding to bytecode execution
- **Stack Diff Visualization** - Before/after previews of stack operations
- **Memory Watch Regions** - Track specific memory addresses with labels and ASCII view
- **Command Interface** - GDB/SoftICE inspired command system (`:help` for commands)
- **Execution Profiling** - Gas usage, instruction counts, basic block analysis
- **Context-Aware Help** - F1 for opcode help, F2 for commands, F3 for shortcuts
- **Enhanced Basic Blocks** - Visual grouping of instruction sequences with gas costs
- **Step-by-step execution** - Granular instruction-level debugging
- **Real-time visualization** - Live updates of all panel states
- **Breakpoint support** - Set/clear breakpoints on any instruction
- **Auto-run mode** - Continuous execution with configurable speed
- **Professional styling** - Dark theme with functional color coding
- **Responsive layout** - Adapts to terminal size changes

### Mock Data Layer
Currently uses realistic mock data that simulates EVM execution. The data layer is designed for easy replacement with the real C API interface.

## 🚀 Getting Started

### Prerequisites
- Go 1.19 or later
- Terminal with ANSI color support
- Minimum 80x24 terminal size (larger recommended)

### Installation

1. Navigate to the CLI directory:
   ```bash
   cd src/cli
   ```

2. Install dependencies:
   ```bash
   go mod download
   ```

3. Build the application:
   ```bash
   go build -o evm-debugger
   ```

### Running

```bash
./evm-debugger
```

Or run directly:
```bash
go run .
```

## 🎮 Controls

### Execution Control
- **Space/Enter** - Step forward one instruction
- **R** - Run/Resume continuous execution
- **P** - Pause execution
- **X** - Reset to beginning

### Navigation
- **Tab** - Switch between panels (Bytecode → Stack → Memory → Solidity → Profiling → Help)
- **Shift+Tab** - Switch panels in reverse
- **↑/↓** or **K/J** - Navigate within active panel
- **Page Up/Down** - Fast scroll within panels
- **:** - Enter command mode (type `help` for available commands)

### Debugging
- **B** - Toggle breakpoint at current instruction
- **Q** or **Ctrl+C** - Quit application

## 🎨 Interface Layout

```
┌─ Status: Paused ──── PC: 0x0004 ──── Gas: 999,985 / 1,000,000 ──── Stack: 2 ─┐
│                                                                               │
│ ┌─ Bytecode ────────────────────┐ ┌─ Stack ──────────────────────────────────┐ │
│ │ 0x0000: PUSH1 0x20           │ │ Top                                      │ │
│ │ 0x0002: PUSH1 0x40           │ │ [0]: 0x0000000000000000000000000000060  │ │
│ │ 0x0004: ► ADD                │ │ [1]: 0x0000000000000000000000000000020  │ │
│ │ 0x0005: PUSH1 0x10           │ │ Bottom                                   │ │
│ │ 0x0007: SUB                  │ └──────────────────────────────────────────┘ │
│ │ 0x0008: STOP                 │ ┌─ Memory ─────────────────────────────────┐ │
│ │                              │ │ 0x0000: 00 00 00 00 00 00 00 00 00 00  │ │
│ │                              │ │ 0x0010: 00 00 00 00 00 00 00 00 00 00  │ │
│ │                              │ │ 0x0020: 00 00 00 00 00 00 00 00 00 00  │ │
│ └──────────────────────────────┘ └──────────────────────────────────────────┘ │
│                                                                               │
│ Space:Step │ R:Run │ P:Pause │ X:Reset │ B:Breakpoint │ Tab:Switch │ Q:Quit │
└───────────────────────────────────────────────────────────────────────────────┘
```

## 🏗️ Architecture

### Component System
- **MockDataProvider** - Simulates EVM execution with realistic behavior and Solidity mapping
- **BytecodePanel** - Disassembled instructions with basic blocks and gas costs
- **StackDiffPanel** - EVM stack visualization with before/after operation previews
- **MemoryPanel** - Hex dump view with watch regions and ASCII display
- **SolidityPanel** - Source code view with line-by-line mapping to bytecode
- **ProfilingPanel** - Execution analytics with gas usage and performance metrics
- **HelpPanel** - Context-aware help system with opcode documentation
- **CommandHandler** - GDB-style command interface for advanced debugging
- **StatusBar** - Execution state, gas, PC, and error display
- **Styling System** - Professional color scheme and responsive layouts

### Data Flow
```
MockDataProvider ←→ UI Components ←→ Main Application
      ↓                    ↓              ↓
   EVM State         Visual Updates   User Input
```

### File Structure
```
cli/
├── main.go              # V1 application and orchestration
├── main_v2.go           # V2 enhanced application with all features
├── mock_data.go         # Mock EVM execution data with Solidity mapping
├── components.go        # Basic UI component implementations
├── solidity_panel.go    # Solidity source code visualization panel
├── stack_diff.go        # Stack diff visualization component
├── commands.go          # GDB-style command interface system
├── profiling.go         # Execution profiling and analytics
├── help_system.go       # Context-aware help and documentation
├── styles.go            # Color schemes and styling system
├── go.mod              # Go module definition
├── go.sum              # Dependency checksums
├── evm-debugger        # Compiled binary
└── README.md           # This documentation
```

## 🎨 Design Principles

### Color Coding
- **Cyan** - Headers, focus indicators, primary elements
- **Green** - Success states, positive values, stack items
- **Yellow** - Current instruction, warnings, low gas
- **Red** - Errors, critical states, breakpoints
- **Gray** - Secondary text, addresses, borders

### UX Philosophy
- **Keyboard-first** - All functionality accessible via keyboard
- **Real-time feedback** - Immediate visual response to state changes
- **Information density** - Maximum useful information in minimal space
- **Professional aesthetics** - Clean, focused, developer-friendly interface

## 🔧 Integration Points

### C API Interface
The mock data provider implements the interface expected for the C API:

```go
type DataProvider interface {
    GetState() *EVMState
    Step() error
    Run() error
    Pause()
    Reset()
    SetBreakpoint(pc uint64)
    ClearBreakpoint(pc uint64)
    IsBreakpoint(pc uint64) bool
}
```

To integrate with the real C API, simply replace `MockDataProvider` with a wrapper around the C interface.

### EVM Integration
Ready for integration with:
- Frame.zig execution state
- Tracer.zig hooks and snapshots
- Real bytecode analysis
- Actual gas consumption tracking
- Memory state changes

## 🚧 Next Steps

1. **C API Integration** - Replace mock provider with real EVM interface
2. **Enhanced Breakpoints** - Conditional breakpoints, watchpoints
3. **Execution History** - Step backward, execution replay
4. **Export Functionality** - Save traces, export state snapshots
5. **Advanced Memory Views** - Smart contract storage, string decoding
6. **Gas Analysis** - Per-instruction gas profiling, optimization hints

## 📦 Dependencies

- [Bubble Tea](https://github.com/charmbracelet/bubbletea) - Terminal UI framework
- [Lip Gloss](https://github.com/charmbracelet/lipgloss) - Style definitions and layout
- [Bubbles](https://github.com/charmbracelet/bubbles) - Reusable UI components

---

*Built with ❤️ for the Guillotine EVM project*