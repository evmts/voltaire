# EVM Debugger CLI

A terminal-based EVM debugger built with Go and Bubble Tea, designed to work with the Guillotine EVM2 interpreter.

## Getting Started

### Prerequisites

- Go 1.19 or later
- Terminal that supports ANSI escape sequences

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
   go build -o evm-debugger main.go
   ```

### Running

Run the debugger:
```bash
./evm-debugger
```

Or run directly with Go:
```bash
go run main.go
```

### Controls

- **↑/↓** or **j/k** - Navigate menu options
- **Enter** or **Space** - Select menu option
- **q** or **Ctrl+C** - Quit application

### Features (Planned)

- Load EVM bytecode for debugging
- Step-by-step execution
- Stack inspection
- Memory visualization
- Breakpoint support
- Integration with Guillotine EVM2 interpreter

## Development

The application follows the Bubble Tea architecture:

- **Model**: Application state (`model` struct)
- **Update**: Handle user input and state changes
- **View**: Render the terminal interface

### Project Structure

```
cli/
├── main.go          # Main application entry point
├── go.mod           # Go module definition
├── go.sum           # Dependency checksums
└── README.md        # This file
```

## Dependencies

- [Bubble Tea](https://github.com/charmbracelet/bubbletea) - Terminal UI framework