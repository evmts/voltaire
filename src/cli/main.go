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
		useMock      = flag.Bool("mock", false, "Use mock data instead of real EVM implementation")
		useGuillotine = flag.Bool("guillotine", false, "Use guillotine-go backend instead of EVM")
		bytecodeHex  = flag.String("bytecode", "", "Hex bytecode to execute (overrides default sample)")
		initialGas   = flag.Uint64("gas", 1000000, "Initial gas amount")
		showInfo     = flag.Bool("info", false, "Show build information and exit")
		showHelp     = flag.Bool("help", false, "Show help and exit")
	)
	flag.Parse()

	// Show help if requested
	if *showHelp {
		flag.Usage()
		fmt.Println("\nEVM Debugger V2 - Professional EVM execution visualizer")
		fmt.Println("Features: Multi-panel TUI, execution profiling, command interface, context help")
		fmt.Println("\nExamples:")
		fmt.Println("  evm-debugger                                    # Real EVM with sample bytecode")
		fmt.Println("  evm-debugger --bytecode 6001600101              # Real EVM with custom bytecode")
		fmt.Println("  evm-debugger --mock                             # Mock data for testing")
		fmt.Println("  evm-debugger --guillotine                       # Use guillotine-go backend")
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
		if *useGuillotine {
			fmt.Println("EVM Debugger V2 - Guillotine Go Backend")
			fmt.Println("Using guillotine-go package for EVM execution")
		} else if !*useMock {
			fmt.Print(BuildInfo())
		} else {
			fmt.Println("EVM Debugger V2 - Mock Mode")
			fmt.Println("Enhanced features: Command interface, profiling, help system")
			fmt.Println("Use without --mock flag to see EVM build information")
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
	} else if *useGuillotine {
		// Use guillotine-go backend
		if *bytecodeHex != "" {
			provider, err = NewGuillotineDataProvider(*bytecodeHex, *initialGas)
		} else {
			provider, err = NewGuillotineDataProviderWithSample()
		}
		
		if err != nil {
			fmt.Printf("Error creating Guillotine provider: %v\n", err)
			fmt.Println("\nMake sure the Guillotine library is built:")
			fmt.Println("  cd ../../ && zig build")
			os.Exit(1)
		}
		
		fmt.Println("Using Guillotine Go Backend")
		
		// Setup cleanup
		defer func() {
			if guillotineProvider, ok := provider.(*GuillotineDataProvider); ok {
				guillotineProvider.Cleanup()
			}
		}()
	} else {
		// Use real EVM implementation (default)
		if *bytecodeHex != "" {
			provider, err = NewEVMDataProvider(*bytecodeHex, *initialGas)
		} else {
			provider, err = NewEVMDataProviderWithSample()
		}
		
		if err != nil {
			fmt.Printf("Error creating EVM provider: %v\n", err)
			fmt.Println("\nTry building the EVM C libraries first:")
			fmt.Println("  cd ../../ && zig build evm-c")
			fmt.Println("\nOr use --mock flag to run with test data")
			os.Exit(1)
		}

		// Print EVM info
		version, buildInfo := GetEVMVersion(), GetEVMBuildInfo()
		fmt.Printf("Using EVM: %s (%s)\n", version, buildInfo)
		
		// Setup cleanup
		defer func() {
			if evmProvider, ok := provider.(*EVMDataProvider); ok {
				evmProvider.Cleanup()
			}
			CleanupEVM()
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