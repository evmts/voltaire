package main

import (
	"fmt"
	"os"

	"guillotine-cli/commands"

	"github.com/urfave/cli/v2"
)

func main() {
	app := &cli.App{
		Name:  "guillotine-bench",
		Usage: "Guillotine EVM CLI and benchmarking tool",
		Action: func(c *cli.Context) error {
			return commands.RunTUI(c)
		},
		Commands: []*cli.Command{
			{
				Name:  "tui",
				Usage: "Launch interactive TUI",
				Action: commands.RunTUI,
			},
			// Core EVM operations matching CallParams variants
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
				Name:  "trace",
				Usage: "Execute and write JSON-RPC trace to a file (default: trace.json)",
				Flags: []cli.Flag{
					&cli.StringFlag{ Name: "bytecode", Usage: "Path to runtime bytecode hex (defaults to snailtracer runtime_clean.txt)", Value: "" },
					&cli.StringFlag{ Name: "calldata", Usage: "Path to calldata hex (defaults to snailtracer calldata.txt)", Value: "" },
					&cli.StringFlag{ Name: "out", Usage: "Output trace file", Value: "trace.json" },
					&cli.StringFlag{ Name: "gas", Usage: "Gas limit", Value: "10000000" },
				},
				Action: commands.RunTrace,
			},
			{
				Name:  "compile",
				Usage: "Compile Solidity source code",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:     "source",
						Aliases:  []string{"s"},
						Usage:    "Solidity source code (inline)",
					},
					&cli.StringFlag{
						Name:     "file",
						Aliases:  []string{"f"},
						Usage:    "Path to Solidity source file",
					},
					&cli.StringFlag{
						Name:     "output",
						Aliases:  []string{"o"},
						Usage:    "Output file path (default: stdout)",
					},
					&cli.StringFlag{
						Name:    "format",
						Usage:   "Output format: json, hex, combined",
						Value:   "json",
					},
					&cli.BoolFlag{
						Name:    "optimize",
						Usage:   "Enable optimizer",
						Value:   true,
					},
					&cli.UintFlag{
						Name:    "optimize-runs",
						Usage:   "Optimizer runs",
						Value:   200,
					},
					&cli.StringFlag{
						Name:    "evm-version",
						Usage:   "EVM version (e.g., london, paris, shanghai)",
					},
				},
				Action: commands.RunCompile,
			},
		},
	}

	if err := app.Run(os.Args); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}