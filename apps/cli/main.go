package main

import (
	"fmt"
	"os"

	"guillotine-cli/commands"

	"github.com/urfave/cli/v2"
)

func main() {
	app := &cli.App{
		Name:  "guil",
		Usage: "Guillotine EVM CLI and benchmarking tool",
		Action: func(c *cli.Context) error {
			return commands.RunTUI(c)
		},
		Commands: []*cli.Command{
			{
				Name:   "tui",
				Usage:  "Launch interactive TUI",
				Action: commands.RunTUI,
			},
			{
				Name:  "call",
				Usage: "Execute a CALL operation",
				Flags: []cli.Flag{
					&cli.StringFlag{Name: "caller", Required: true, Usage: "Caller address"},
					&cli.StringFlag{Name: "to", Required: true, Usage: "Target contract address"},
					&cli.StringFlag{Name: "value", Value: "0", Usage: "Wei value to transfer"},
					&cli.StringFlag{Name: "input", Value: "", Usage: "Input data (hex)"},
					&cli.StringFlag{Name: "gas", Required: true, Usage: "Gas limit"},
					&cli.StringFlag{Name: "format", Value: "hex", Usage: "Output format: hex, json"},
				},
				Action: commands.ExecuteCall,
			},
			{
				Name:  "callcode",
				Usage: "Execute a CALLCODE operation",
				Flags: []cli.Flag{
					&cli.StringFlag{Name: "caller", Required: true, Usage: "Caller address"},
					&cli.StringFlag{Name: "to", Required: true, Usage: "Target contract address"},
					&cli.StringFlag{Name: "value", Value: "0", Usage: "Wei value to transfer"},
					&cli.StringFlag{Name: "input", Value: "", Usage: "Input data (hex)"},
					&cli.StringFlag{Name: "gas", Required: true, Usage: "Gas limit"},
					&cli.StringFlag{Name: "format", Value: "hex", Usage: "Output format: hex, json"},
				},
				Action: commands.ExecuteCallcode,
			},
			{
				Name:  "delegatecall",
				Usage: "Execute a DELEGATECALL operation",
				Flags: []cli.Flag{
					&cli.StringFlag{Name: "caller", Required: true, Usage: "Caller address"},
					&cli.StringFlag{Name: "to", Required: true, Usage: "Target contract address"},
					&cli.StringFlag{Name: "input", Value: "", Usage: "Input data (hex)"},
					&cli.StringFlag{Name: "gas", Required: true, Usage: "Gas limit"},
					&cli.StringFlag{Name: "format", Value: "hex", Usage: "Output format: hex, json"},
				},
				Action: commands.ExecuteDelegatecall,
			},
			{
				Name:  "staticcall",
				Usage: "Execute a STATICCALL operation",
				Flags: []cli.Flag{
					&cli.StringFlag{Name: "caller", Required: true, Usage: "Caller address"},
					&cli.StringFlag{Name: "to", Required: true, Usage: "Target contract address"},
					&cli.StringFlag{Name: "input", Value: "", Usage: "Input data (hex)"},
					&cli.StringFlag{Name: "gas", Required: true, Usage: "Gas limit"},
					&cli.StringFlag{Name: "format", Value: "hex", Usage: "Output format: hex, json"},
				},
				Action: commands.ExecuteStaticcall,
			},
			{
				Name:  "create",
				Usage: "Execute a CREATE operation",
				Flags: []cli.Flag{
					&cli.StringFlag{Name: "caller", Required: true, Usage: "Caller address"},
					&cli.StringFlag{Name: "value", Value: "0", Usage: "Wei value to transfer"},
					&cli.StringFlag{Name: "init-code", Required: true, Usage: "Initialization code (hex)"},
					&cli.StringFlag{Name: "gas", Required: true, Usage: "Gas limit"},
					&cli.StringFlag{Name: "format", Value: "hex", Usage: "Output format: hex, json"},
				},
				Action: commands.ExecuteCreate,
			},
			{
				Name:  "create2",
				Usage: "Execute a CREATE2 operation",
				Flags: []cli.Flag{
					&cli.StringFlag{Name: "caller", Required: true, Usage: "Caller address"},
					&cli.StringFlag{Name: "value", Value: "0", Usage: "Wei value to transfer"},
					&cli.StringFlag{Name: "init-code", Required: true, Usage: "Initialization code (hex)"},
					&cli.StringFlag{Name: "salt", Required: true, Usage: "Salt value (hex)"},
					&cli.StringFlag{Name: "gas", Required: true, Usage: "Gas limit"},
					&cli.StringFlag{Name: "format", Value: "hex", Usage: "Output format: hex, json"},
				},
				Action: commands.ExecuteCreate2,
			},
			// JSON-RPC compatible commands
			{
				Name:  "estimategas",
				Usage: "Estimate gas for a transaction (eth_estimateGas compatible)",
				Flags: []cli.Flag{
					&cli.StringFlag{Name: "from", Required: true, Usage: "From address"},
					&cli.StringFlag{Name: "to", Usage: "To address"},
					&cli.StringFlag{Name: "value", Value: "0", Usage: "Wei value"},
					&cli.StringFlag{Name: "data", Value: "", Usage: "Input data (hex)"},
				},
				Action: commands.ExecuteEstimateGas,
			},
			{
				Name:  "accesslist",
				Usage: "Get access list for a transaction (eth_createAccessList compatible)",
				Flags: []cli.Flag{
					&cli.StringFlag{Name: "from", Required: true, Usage: "From address"},
					&cli.StringFlag{Name: "to", Usage: "To address"},
					&cli.StringFlag{Name: "value", Value: "0", Usage: "Wei value"},
					&cli.StringFlag{Name: "data", Value: "", Usage: "Input data (hex)"},
					&cli.StringFlag{Name: "gas", Value: "10000000", Usage: "Gas limit"},
				},
				Action: commands.ExecuteAccessList,
			},
			{
				Name:      "trace",
				Usage:     "Execute a CALL with JSON-RPC tracing enabled",
				ArgsUsage: "[snailtracer]  # Use 'snailtracer' for test fixture",
				Flags: []cli.Flag{
					// Standard CallParams fields
					&cli.StringFlag{Name: "caller", Usage: "Caller address (required unless using fixture)"},
					&cli.StringFlag{Name: "to", Usage: "Target contract address (required unless using fixture)"},
					&cli.StringFlag{Name: "value", Value: "0", Usage: "Wei value to transfer"},
					&cli.StringFlag{Name: "input", Value: "", Usage: "Input data (hex)"},
					&cli.StringFlag{Name: "gas", Value: "10000000", Usage: "Gas limit"},
				},
				Action: commands.RunTrace,
			},
			{
				Name:      "differential",
				Usage:     "Run differential test between Guillotine and revme",
				ArgsUsage: "<fixture-name>",
				Action:    commands.RunDifferential,
			},
			{
				Name:  "compile",
				Usage: "Compile Solidity source code",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:    "source",
						Aliases: []string{"s"},
						Usage:   "Solidity source code (inline)",
					},
					&cli.StringFlag{
						Name:    "file",
						Aliases: []string{"f"},
						Usage:   "Path to Solidity source file",
					},
					&cli.StringFlag{
						Name:    "output",
						Aliases: []string{"o"},
						Usage:   "Output file path (default: stdout)",
					},
					&cli.StringFlag{
						Name:  "format",
						Usage: "Output format: json, hex, combined",
						Value: "json",
					},
					&cli.BoolFlag{
						Name:  "optimize",
						Usage: "Enable optimizer",
						Value: true,
					},
					&cli.UintFlag{
						Name:  "optimize-runs",
						Usage: "Optimizer runs",
						Value: 200,
					},
					&cli.StringFlag{
						Name:  "evm-version",
						Usage: "EVM version (e.g., london, paris, shanghai)",
					},
				},
				Action: commands.RunCompile,
			},
			{
				Name:      "save-fixture",
				Usage:     "Save current call parameters and state as a fixture",
				ArgsUsage: "<fixture-name>",
				Flags: []cli.Flag{
					&cli.StringFlag{Name: "caller", Usage: "Caller address"},
					&cli.StringFlag{Name: "to", Usage: "Target address"},
					&cli.StringFlag{Name: "value", Value: "0", Usage: "Wei value"},
					&cli.StringFlag{Name: "input", Value: "", Usage: "Input data (hex)"},
					&cli.StringFlag{Name: "gas", Value: "10000000", Usage: "Gas limit"},
					&cli.StringFlag{Name: "description", Usage: "Fixture description"},
					&cli.StringFlag{Name: "network", Value: "Cancun", Usage: "Network name"},
					&cli.StringFlag{Name: "dir", Usage: "Directory to save fixture (optional)"},
					&cli.BoolFlag{Name: "execute", Usage: "Execute and capture post-state"},
				},
				Action: commands.SaveFixture,
			},
			{
				Name:      "load-fixture",
				Usage:     "Load and display fixture information",
				ArgsUsage: "<fixture-name-or-path>",
				Action:    commands.LoadFixture,
			},
			{
				Name:  "list-fixtures",
				Usage: "List available fixtures",
				Flags: []cli.Flag{
					&cli.StringFlag{Name: "dir", Usage: "Directory to list fixtures from (optional)"},
				},
				Action: commands.ListFixtures,
			},
			{
				Name:      "bytecode",
				Usage:     "Pretty print EVM bytecode with disassembly",
				ArgsUsage: "[fixture-name | file-path | hex-bytecode]",
				Action:    commands.ExecuteBytecode,
			},
			{
				Name:      "dispatch",
				Usage:     "Pretty print EVM bytecode dispatch schedule with debug info",
				ArgsUsage: "[fixture-name | file-path | hex-bytecode]",
				Action:    commands.ExecuteDispatch,
			},
			{
				Name:      "bench",
				Usage:     "Benchmark EVM execution using hyperfine (defaults to snailtracer if no args)",
				ArgsUsage: "[fixture-path]",
				Flags: []cli.Flag{
					// Call parameters (same as call command)
					&cli.StringFlag{Name: "caller", Usage: "Caller address"},
					&cli.StringFlag{Name: "to", Usage: "Target contract address"},
					&cli.StringFlag{Name: "value", Value: "0", Usage: "Wei value to transfer"},
					&cli.StringFlag{Name: "input", Value: "", Usage: "Input data (hex)"},
					&cli.StringFlag{Name: "gas", Usage: "Gas limit"},
					&cli.StringFlag{Name: "format", Value: "hex", Usage: "Output format: hex, json"},

					// Hyperfine parameters
					&cli.IntFlag{Name: "warmup", Value: 3, Usage: "Number of warmup runs before benchmarking"},
					&cli.IntFlag{Name: "runs", Usage: "Number of runs (default: automatic)"},
					&cli.IntFlag{Name: "min-runs", Value: 10, Usage: "Minimum number of runs"},
					&cli.IntFlag{Name: "max-runs", Usage: "Maximum number of runs"},
					&cli.StringFlag{Name: "prepare", Usage: "Command to run before each benchmark run"},
					&cli.StringFlag{Name: "cleanup", Usage: "Command to run after each benchmark run"},
					&cli.StringFlag{Name: "parameter-scan", Usage: "Perform parameter scan (e.g., '1 100' for gas)"},
					&cli.IntFlag{Name: "parameter-step", Usage: "Parameter step size for scan"},
					&cli.StringFlag{Name: "parameter-list", Usage: "Comma-separated list of parameter values"},
					&cli.BoolFlag{Name: "show-output", Usage: "Show command output"},
					&cli.StringFlag{Name: "export-json", Usage: "Export results to JSON file"},
					&cli.StringFlag{Name: "export-csv", Usage: "Export results to CSV file"},
					&cli.StringFlag{Name: "export-markdown", Usage: "Export results to Markdown file"},
					&cli.StringFlag{Name: "time-unit", Value: "millisecond", Usage: "Time unit: millisecond, second"},
					&cli.StringFlag{Name: "compare", Usage: "Command to compare against"},
				},
				Action: commands.ExecuteBench,
			},
		},
	}

	if err := app.Run(os.Args); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

