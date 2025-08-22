package main

import (
	"flag"
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"
)

func main() {
	// Parse command line arguments
	var (
		useMock     = flag.Bool("mock", false, "Use mock data instead of real EVM2 implementation")
		bytecodeHex = flag.String("bytecode", "", "Hex bytecode to execute (overrides default sample)")
		initialGas  = flag.Uint64("gas", 1000000, "Initial gas amount")
		showInfo    = flag.Bool("info", false, "Show build information and exit")
		showHelp    = flag.Bool("help", false, "Show help and exit")
	)
	flag.Parse()

	// Show help if requested
	if *showHelp {
		flag.Usage()
		fmt.Println("\nEVM Debugger V2 - Professional EVM execution visualizer")
		fmt.Println("Features: Multi-panel TUI, execution profiling, command interface, context help")
		fmt.Println("\nExamples:")
		fmt.Println("  evm-debugger                                    # Real EVM2 with sample bytecode")
		fmt.Println("  evm-debugger --bytecode 6001600101              # Real EVM2 with custom bytecode")
		fmt.Println("  evm-debugger --mock                             # Mock data for testing")
		fmt.Println("  evm-debugger --info                             # Show build information")
		fmt.Println("\nControls:")
		fmt.Println("  Space/Enter - Step execution")
		fmt.Println("  R - Run/Resume, P - Pause, X - Reset")
		fmt.Println("  B - Toggle breakpoint")
		fmt.Println("  : - Command mode (type 'help' for commands)")
		fmt.Println("  F1 - Opcode help, F2 - Commands, F3 - Keyboard shortcuts")
		fmt.Println("  Tab - Switch panels, V - Stack preview, A - ASCII toggle")
		fmt.Println("  Q/Ctrl+C - Quit")
		return
	}

	// Show build info if requested
	if *showInfo {
		if !*useMock {
			fmt.Print(BuildInfo())
		} else {
			fmt.Println("EVM Debugger V2 - Mock Mode")
			fmt.Println("Enhanced features: Command interface, profiling, help system")
			fmt.Println("Use without --mock flag to see EVM2 build information")
		}
		return
	}

	// Create the appropriate data provider
	var provider DataProvider
	var err error

	if *useMock {
		// Use mock data provider for testing
		mockProvider := NewMockDataProvider()
		provider = DataProvider(mockProvider)
		fmt.Println("Using Enhanced Mock Data Provider V2")
		fmt.Println("Features: Gas profiling, basic blocks, execution history, memory watches")
	} else {
		// Use real EVM2 implementation (default)
		if *bytecodeHex != "" {
			provider, err = NewEVM2DataProvider(*bytecodeHex, *initialGas)
		} else {
			provider, err = NewEVM2DataProviderWithSample()
		}
		
		if err != nil {
			fmt.Printf("Error creating EVM2 provider: %v\n", err)
			fmt.Println("\nTry building the EVM2 C libraries first:")
			fmt.Println("  cd ../../ && zig build evm2-c")
			fmt.Println("\nOr use --mock flag to run with test data")
			os.Exit(1)
		}

		// Print EVM2 info
		version, buildInfo := GetEVM2Version(), GetEVM2BuildInfo()
		fmt.Printf("Using EVM2: %s (%s)\n", version, buildInfo)
		
		// Setup cleanup
		defer func() {
			if evm2Provider, ok := provider.(*EVM2DataProvider); ok {
				evm2Provider.Cleanup()
			}
			CleanupEVM2()
		}()
	}

	// Use V2 interface
	m := NewModelV2WithProvider(provider)
	
	// Configure the tea program
	p := tea.NewProgram(
		m,
		tea.WithAltScreen(),       // Use alternate screen buffer
		tea.WithMouseCellMotion(), // Enable mouse support
	)
	
	// Start the program
	if _, err := p.Run(); err != nil {
		fmt.Printf("Error running EVM debugger: %v\n", err)
		os.Exit(1)
	}
}