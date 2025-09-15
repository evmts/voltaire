package main

import (
	"encoding/hex"
	"fmt"
	"io"
	"math/big"
	"os"
	"strings"
	"time"

	"guillotine-cli/internal/app"
	"guillotine-cli/internal/compiler"

	tea "github.com/charmbracelet/bubbletea"
	guillotine "github.com/evmts/guillotine/sdks/go"
	"github.com/evmts/guillotine/sdks/go/evm"
	"github.com/evmts/guillotine/sdks/go/primitives"
	"github.com/urfave/cli/v2"
)

// ========================
// Shared Utilities
// ========================

// parseAddress converts a hex string to an Address
func parseAddress(s string) (primitives.Address, error) {
	return primitives.AddressFromHex(s)
}

// parseBigInt converts a string to a big.Int (supports decimal and hex with 0x prefix)
func parseBigInt(s string) (*big.Int, error) {
	if s == "" {
		return big.NewInt(0), nil
	}
	if strings.HasPrefix(s, "0x") || strings.HasPrefix(s, "0X") {
		// Parse as hex
		s = s[2:]
		n := new(big.Int)
		_, ok := n.SetString(s, 16)
		if !ok {
			return nil, fmt.Errorf("invalid hex number: %s", s)
		}
		return n, nil
	}
	// Parse as decimal
	n := new(big.Int)
	_, ok := n.SetString(s, 10)
	if !ok {
		return nil, fmt.Errorf("invalid decimal number: %s", s)
	}
	return n, nil
}

// parseGas converts a string to uint64 gas value
func parseGas(s string) (uint64, error) {
	n, err := parseBigInt(s)
	if err != nil {
		return 0, err
	}
	if !n.IsUint64() {
		return 0, fmt.Errorf("gas value too large: %s", s)
	}
	return n.Uint64(), nil
}

// setupEVM creates and initializes an EVM instance with proper state
func setupEVM(c *cli.Context) (*evm.EVM, error) {
	vm, err := evm.New()
	if err != nil {
		return nil, fmt.Errorf("failed to create EVM: %w", err)
	}
	
	// TODO: Setup initial state from flags if needed
	// For now, we'll use defaults
	
	return vm, nil
}

// outputResult formats and outputs the CallResult based on format flag
func outputResult(c *cli.Context, result *guillotine.CallResult) error {
	format := c.String("format")
	
	// Check for execution failure
	if !result.Success {
		if result.ErrorInfo != "" {
			return fmt.Errorf("execution failed: %s", result.ErrorInfo)
		}
		if len(result.Output) > 0 {
			// Revert with data
			return fmt.Errorf("execution reverted: 0x%x", result.Output)
		}
		return fmt.Errorf("execution failed")
	}
	
	switch format {
	case "hex":
		// For create operations, output the created address
		if result.CreatedAddress != nil {
			fmt.Printf("%s\n", result.CreatedAddress.Hex())
		} else if len(result.Output) > 0 {
			fmt.Printf("0x%x\n", result.Output)
		} else {
			fmt.Printf("0x\n")
		}
	case "json":
		// TODO: Implement JSON output
		return fmt.Errorf("JSON output not yet implemented")
	default:
		return fmt.Errorf("unknown format: %s", format)
	}
	
	return nil
}

// ========================
// Parameter Parsing Helpers (Rule of 3 - used in multiple commands)
// ========================

type CommonParams struct {
	Caller primitives.Address
	Gas    uint64
}

type CallParams struct {
	CommonParams
	To    primitives.Address
	Value *big.Int
	Input []byte
}

type CreateParams struct {
	CommonParams
	Value    *big.Int
	InitCode []byte
	Salt     *big.Int // Only for CREATE2
}

// parseCommonParams extracts caller and gas parameters (used by all commands)
func parseCommonParams(c *cli.Context) (CommonParams, error) {
	caller, err := parseAddress(c.String("caller"))
	if err != nil {
		return CommonParams{}, fmt.Errorf("invalid caller address: %w", err)
	}
	
	gas, err := parseGas(c.String("gas"))
	if err != nil {
		return CommonParams{}, fmt.Errorf("invalid gas: %w", err)
	}
	
	return CommonParams{Caller: caller, Gas: gas}, nil
}

// parseCallParams extracts parameters for CALL-like operations
func parseCallParams(c *cli.Context, needValue bool) (CallParams, error) {
	common, err := parseCommonParams(c)
	if err != nil {
		return CallParams{}, err
	}
	
	to, err := parseAddress(c.String("to"))
	if err != nil {
		return CallParams{}, fmt.Errorf("invalid to address: %w", err)
	}
	
	var value *big.Int
	if needValue {
		value, err = parseBigInt(c.String("value"))
		if err != nil {
			return CallParams{}, fmt.Errorf("invalid value: %w", err)
		}
	} else {
		value = big.NewInt(0)
	}
	
	input, err := parseHex(c.String("input"))
	if err != nil {
		return CallParams{}, fmt.Errorf("invalid input data: %w", err)
	}
	
	return CallParams{
		CommonParams: common,
		To:          to,
		Value:       value,
		Input:       input,
	}, nil
}

// parseCreateParams extracts parameters for CREATE operations
func parseCreateParams(c *cli.Context, needSalt bool) (CreateParams, error) {
	common, err := parseCommonParams(c)
	if err != nil {
		return CreateParams{}, err
	}
	
	value, err := parseBigInt(c.String("value"))
	if err != nil {
		return CreateParams{}, fmt.Errorf("invalid value: %w", err)
	}
	
	initCode, err := parseHex(c.String("init-code"))
	if err != nil {
		return CreateParams{}, fmt.Errorf("invalid init code: %w", err)
	}
	
	var salt *big.Int
	if needSalt {
		salt, err = parseBigInt(c.String("salt"))
		if err != nil {
			return CreateParams{}, fmt.Errorf("invalid salt: %w", err)
		}
	}
	
	return CreateParams{
		CommonParams: common,
		Value:       value,
		InitCode:    initCode,
		Salt:        salt,
	}, nil
}

// executeWithBalance ensures the caller has sufficient balance before execution
func executeWithBalance(vm *evm.EVM, caller primitives.Address, value *big.Int) error {
	if value != nil && value.Sign() > 0 {
		// Ensure caller has sufficient balance
		balance := new(big.Int).Add(value, big.NewInt(1000000000000000000))
		if err := vm.SetBalance(caller, balance); err != nil {
			return fmt.Errorf("failed to set caller balance: %w", err)
		}
	}
	return nil
}

// ========================
// Command Implementations
// ========================

func executeCall(c *cli.Context) error {
	params, err := parseCallParams(c, true) // needValue = true
	if err != nil {
		return err
	}
	
	vm, err := setupEVM(c)
	if err != nil {
		return err
	}
	defer vm.Destroy()
	
	if err := executeWithBalance(vm, params.Caller, params.Value); err != nil {
		return err
	}
	
	result, err := vm.Call(evm.Call{
		Caller: params.Caller,
		To:     params.To,
		Value:  params.Value,
		Input:  params.Input,
		Gas:    params.Gas,
	})
	if err != nil {
		return fmt.Errorf("call execution failed: %w", err)
	}
	
	return outputResult(c, result)
}

func executeCallcode(c *cli.Context) error {
	params, err := parseCallParams(c, true) // needValue = true
	if err != nil {
		return err
	}
	
	vm, err := setupEVM(c)
	if err != nil {
		return err
	}
	defer vm.Destroy()
	
	if err := executeWithBalance(vm, params.Caller, params.Value); err != nil {
		return err
	}
	
	result, err := vm.Call(evm.Callcode{
		Caller: params.Caller,
		To:     params.To,
		Value:  params.Value,
		Input:  params.Input,
		Gas:    params.Gas,
	})
	if err != nil {
		return fmt.Errorf("callcode execution failed: %w", err)
	}
	
	return outputResult(c, result)
}

func executeDelegatecall(c *cli.Context) error {
	params, err := parseCallParams(c, false) // needValue = false
	if err != nil {
		return err
	}
	
	vm, err := setupEVM(c)
	if err != nil {
		return err
	}
	defer vm.Destroy()
	
	result, err := vm.Call(evm.Delegatecall{
		Caller: params.Caller,
		To:     params.To,
		Input:  params.Input,
		Gas:    params.Gas,
	})
	if err != nil {
		return fmt.Errorf("delegatecall execution failed: %w", err)
	}
	
	return outputResult(c, result)
}

func executeStaticcall(c *cli.Context) error {
	params, err := parseCallParams(c, false) // needValue = false
	if err != nil {
		return err
	}
	
	vm, err := setupEVM(c)
	if err != nil {
		return err
	}
	defer vm.Destroy()
	
	result, err := vm.Call(evm.Staticcall{
		Caller: params.Caller,
		To:     params.To,
		Input:  params.Input,
		Gas:    params.Gas,
	})
	if err != nil {
		return fmt.Errorf("staticcall execution failed: %w", err)
	}
	
	return outputResult(c, result)
}

func executeCreate(c *cli.Context) error {
	params, err := parseCreateParams(c, false) // needSalt = false
	if err != nil {
		return err
	}
	
	vm, err := setupEVM(c)
	if err != nil {
		return err
	}
	defer vm.Destroy()
	
	if err := executeWithBalance(vm, params.Caller, params.Value); err != nil {
		return err
	}
	
	result, err := vm.Call(evm.Create{
		Caller:   params.Caller,
		Value:    params.Value,
		InitCode: params.InitCode,
		Gas:      params.Gas,
	})
	if err != nil {
		return fmt.Errorf("create execution failed: %w", err)
	}
	
	return outputResult(c, result)
}

func executeCreate2(c *cli.Context) error {
	params, err := parseCreateParams(c, true) // needSalt = true
	if err != nil {
		return err
	}
	
	vm, err := setupEVM(c)
	if err != nil {
		return err
	}
	defer vm.Destroy()
	
	if err := executeWithBalance(vm, params.Caller, params.Value); err != nil {
		return err
	}
	
	result, err := vm.Call(evm.Create2{
		Caller:   params.Caller,
		Value:    params.Value,
		InitCode: params.InitCode,
		Salt:     params.Salt,
		Gas:      params.Gas,
	})
	if err != nil {
		return fmt.Errorf("create2 execution failed: %w", err)
	}
	
	return outputResult(c, result)
}

// ========================
// JSON-RPC Compatible Commands
// ========================

func executeEstimateGas(c *cli.Context) error {
	// Parse JSON-RPC style parameters
	from, err := parseAddress(c.String("from"))
	if err != nil {
		return fmt.Errorf("invalid from address: %w", err)
	}
	
	var to primitives.Address
	if c.IsSet("to") {
		to, err = parseAddress(c.String("to"))
		if err != nil {
			return fmt.Errorf("invalid to address: %w", err)
		}
	}
	
	value, err := parseBigInt(c.String("value"))
	if err != nil {
		return fmt.Errorf("invalid value: %w", err)
	}
	
	data, err := parseHex(c.String("data"))
	if err != nil {
		return fmt.Errorf("invalid data: %w", err)
	}
	
	// Setup EVM
	vm, err := setupEVM(c)
	if err != nil {
		return err
	}
	defer vm.Destroy()
	
	// Ensure from has balance
	if err := executeWithBalance(vm, from, value); err != nil {
		return err
	}
	
	// Use a high gas limit for estimation
	const estimateGasLimit uint64 = 10000000
	
	// Determine if this is a create or call
	var result *guillotine.CallResult
	var zeroAddr primitives.Address
	if !c.IsSet("to") || to == zeroAddr {
		// CREATE operation
		result, err = vm.Call(evm.Create{
			Caller:   from,
			Value:    value,
			InitCode: data,
			Gas:      estimateGasLimit,
		})
	} else {
		// CALL operation
		result, err = vm.Call(evm.Call{
			Caller: from,
			To:     to,
			Value:  value,
			Input:  data,
			Gas:    estimateGasLimit,
		})
	}
	
	if err != nil {
		return fmt.Errorf("gas estimation failed: %w", err)
	}
	
	// Calculate gas used
	gasUsed := estimateGasLimit - result.GasLeft
	
	// Output in JSON-RPC hex format
	fmt.Printf("0x%x\n", gasUsed)
	return nil
}

func executeAccessList(c *cli.Context) error {
	// Parse JSON-RPC style parameters
	from, err := parseAddress(c.String("from"))
	if err != nil {
		return fmt.Errorf("invalid from address: %w", err)
	}
	
	var to primitives.Address
	if c.IsSet("to") {
		to, err = parseAddress(c.String("to"))
		if err != nil {
			return fmt.Errorf("invalid to address: %w", err)
		}
	}
	
	value, err := parseBigInt(c.String("value"))
	if err != nil {
		return fmt.Errorf("invalid value: %w", err)
	}
	
	data, err := parseHex(c.String("data"))
	if err != nil {
		return fmt.Errorf("invalid data: %w", err)
	}
	
	gas, err := parseGas(c.String("gas"))
	if err != nil {
		return fmt.Errorf("invalid gas: %w", err)
	}
	
	// Setup EVM with access list tracking
	vm, err := setupEVM(c)
	if err != nil {
		return err
	}
	defer vm.Destroy()
	
	// Ensure from has balance
	if err := executeWithBalance(vm, from, value); err != nil {
		return err
	}
	
	// Execute the call to collect access list
	var result *guillotine.CallResult
	var zeroAddr primitives.Address
	if !c.IsSet("to") || to == zeroAddr {
		result, err = vm.Call(evm.Create{
			Caller:   from,
			Value:    value,
			InitCode: data,
			Gas:      gas,
		})
	} else {
		result, err = vm.Call(evm.Call{
			Caller: from,
			To:     to,
			Value:  value,
			Input:  data,
			Gas:    gas,
		})
	}
	
	if err != nil {
		return fmt.Errorf("access list generation failed: %w", err)
	}
	
	// Format as JSON-RPC eth_createAccessList response
	// Note: The actual accessed addresses and storage would come from result.AccessedAddresses
	// and result.AccessedStorage, but these fields may not be populated yet in the SDK
	
	// For now, return a minimal access list format
	fmt.Printf(`{"accessList":[],"gasUsed":"0x%x"}`+"\n", gas - result.GasLeft)
	return nil
}

func main() {
	app := &cli.App{
		Name:  "guillotine-bench",
		Usage: "Guillotine EVM CLI and benchmarking tool",
		Action: func(c *cli.Context) error {
			return runTUI()
		},
		Commands: []*cli.Command{
			{
				Name:  "tui",
				Usage: "Launch interactive TUI",
				Action: func(c *cli.Context) error {
					return runTUI()
				},
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
				Action: executeCall,
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
				Action: executeCallcode,
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
				Action: executeDelegatecall,
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
				Action: executeStaticcall,
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
				Action: executeCreate,
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
				Action: executeCreate2,
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
				Action: executeEstimateGas,
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
				Action: executeAccessList,
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
				Action: func(c *cli.Context) error {
					return runTrace(c)
				},
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
				Action: func(c *cli.Context) error {
					return runCompile(c)
				},
			},
		},
	}

	if err := app.Run(os.Args); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func runTUI() error {
	p := tea.NewProgram(app.InitialModel())
	if _, err := p.Run(); err != nil {
		return fmt.Errorf("error running Guillotine CLI: %w", err)
	}
	return nil
}

func callBytecode(c *cli.Context) error {
	var bytecode []byte
	var err error

	// Get bytecode from file or stdin
	codeFile := c.String("codefile")
	if codeFile != "" {
		// Read from file
		data, err := os.ReadFile(codeFile)
		if err != nil {
			return fmt.Errorf("failed to read codefile: %w", err)
		}
		bytecode, err = parseHex(string(data))
		if err != nil {
			return fmt.Errorf("invalid hex in codefile: %w", err)
		}
	} else {
		// Read from stdin
		data, err := io.ReadAll(os.Stdin)
		if err != nil {
			return fmt.Errorf("failed to read from stdin: %w", err)
		}
		if len(data) == 0 {
			return fmt.Errorf("no bytecode provided via --codefile or stdin")
		}
		bytecode, err = parseHex(string(data))
		if err != nil {
			return fmt.Errorf("invalid hex from stdin: %w", err)
		}
	}

	// Debug: Log what we got from file
	if codeFile != "" {
		fileData, _ := os.ReadFile(codeFile)
		fmt.Fprintf(os.Stderr, "Raw file length: %d chars\n", len(fileData))
		if len(fileData) > 0 {
			fmt.Fprintf(os.Stderr, "First 40 chars: %s\n", fileData[:min(40, len(fileData))])
			fmt.Fprintf(os.Stderr, "Last 40 chars: %s\n", fileData[max(0, len(fileData)-40):])
		}
	}
	
	// Debug: Log bytecode info
	fmt.Fprintf(os.Stderr, "Parsed bytecode length: %d bytes\n", len(bytecode))
	if len(bytecode) > 0 {
		fmt.Fprintf(os.Stderr, "First 20 bytes: %x\n", bytecode[:min(20, len(bytecode))])
		fmt.Fprintf(os.Stderr, "Last 20 bytes: %x\n", bytecode[max(0, len(bytecode)-20):])
	}
	
	// Parse gas limit
	gasStr := c.String("gas")
	if gasStr == "" {
		return fmt.Errorf("--gas is required")
	}
	var gas uint64
	if _, err := fmt.Sscanf(gasStr, "%d", &gas); err != nil {
		return fmt.Errorf("invalid gas limit: %w", err)
	}

	// Parse input data
	inputStr := c.String("input")
	var input []byte
	if inputStr != "" {
		input, err = parseHex(inputStr)
		if err != nil {
			return fmt.Errorf("invalid hex in input: %w", err)
		}
	}

	// Create EVM instance
	vm, err := evm.New()
	if err != nil {
		return fmt.Errorf("failed to create EVM: %w", err)
	}
	defer vm.Destroy()
	
	// Use a default caller address
	caller, err := primitives.AddressFromHex("0x1000000000000000000000000000000000000000")
	if err != nil {
		return fmt.Errorf("failed to create caller address: %w", err)
	}
	
	// Set caller balance to ensure execution
	if err := vm.SetBalance(caller, big.NewInt(1000000000000000000)); err != nil {
		return fmt.Errorf("failed to set caller balance: %w", err)
	}
	
	var contractAddr primitives.Address
	var callResult *guillotine.CallResult
	
	if c.Bool("deploy") {
		// Deploy the bytecode first (treating it as constructor bytecode)
		fmt.Fprintf(os.Stderr, "Deploying bytecode (%d bytes)...\n", len(bytecode))
		
		// Start timing for deployment + execution
		start := time.Now()
		
		// Deploy the contract using Create
		deployResult, err := vm.Call(evm.Create{
			Caller:   caller,
			Value:    big.NewInt(0),
			InitCode: bytecode,
			Gas:      gas / 2, // Use half gas for deployment
		})
		
		if err != nil {
			return fmt.Errorf("deployment failed: %w", err)
		}
		
		if !deployResult.Success {
			return fmt.Errorf("deployment reverted: %s", deployResult.ErrorInfo)
		}
		
		if deployResult.CreatedAddress != nil {
			contractAddr = *deployResult.CreatedAddress
		} else {
			return fmt.Errorf("deployment succeeded but no address returned")
		}
		fmt.Fprintf(os.Stderr, "Contract deployed at: %s\n", contractAddr.Hex())
		fmt.Fprintf(os.Stderr, "Deployment gas used: %d\n", (gas/2) - deployResult.GasLeft)
		
		// Now call the deployed contract
		callResult, err = vm.Call(evm.Call{
			Caller: caller,
			To:     contractAddr,
			Value:  big.NewInt(0),
			Input:  input,
			Gas:    gas / 2, // Use remaining half for call
		})
		
		// End timing
		elapsed := time.Since(start)
		fmt.Fprintf(os.Stderr, "Total execution time (deploy + call): %v\n", elapsed)
	} else {
		// For benchmarking, we expect already-deployed runtime bytecode
		// Set up a contract address for execution
		contractAddr, _ = primitives.AddressFromHex("0x1000000000000000000000000000000000000001")
		
		// Set the runtime code at the contract address
		if err := vm.SetCode(contractAddr, bytecode); err != nil {
			return fmt.Errorf("failed to set contract code: %w", err)
		}
		
		// Start timing for the actual execution
		execStart := time.Now()
		
		// Call the contract with the input data
		callResult, err = vm.Call(evm.Call{
			Caller: caller,
			To:     contractAddr,
			Value:  big.NewInt(0),
			Input:  input,
			Gas:    gas,
		})
		
		// End timing
		elapsed := time.Since(execStart)
		fmt.Fprintf(os.Stderr, "Execution time: %v\n", elapsed)
		
	}
	
	if err != nil {
		return fmt.Errorf("call failed: %w", err)
	}
	
	// Calculate gas consumed
	gasUsed := gas - callResult.GasLeft
	fmt.Fprintf(os.Stderr, "Gas consumed: %d / %d\n", gasUsed, gas)
	
	if !callResult.Success {
		return fmt.Errorf("call reverted: %s", callResult.ErrorInfo)
	}
	
	// Output results
	if callResult.Output != nil {
		fmt.Printf("0x%x\n", callResult.Output)
	}
	
	return nil
}

func runTrace(c *cli.Context) error {
    bytecodePath := c.String("bytecode")
    calldataPath := c.String("calldata")
    outPath := c.String("out")
    gasStr := c.String("gas")

    if bytecodePath == "" {
        bytecodePath = "/Users/williamcory/Guillotine/src/_test_utils/fixtures/snailtracer/runtime_clean.txt"
    }
    if calldataPath == "" {
        calldataPath = "/Users/williamcory/Guillotine/src/_test_utils/fixtures/snailtracer/calldata.txt"
    }

    bcBytesRaw, err := os.ReadFile(bytecodePath)
    if err != nil { return fmt.Errorf("failed to read bytecode: %w", err) }
    bytecode, err := parseHex(string(bcBytesRaw))
    if err != nil { return fmt.Errorf("invalid bytecode hex: %w", err) }

    cdBytesRaw, err := os.ReadFile(calldataPath)
    if err != nil { return fmt.Errorf("failed to read calldata: %w", err) }
    calldata, err := parseHex(string(cdBytesRaw))
    if err != nil { return fmt.Errorf("invalid calldata hex: %w", err) }

    var gas uint64
    if _, err := fmt.Sscanf(gasStr, "%d", &gas); err != nil {
        return fmt.Errorf("invalid gas: %w", err)
    }

    vm, err := evm.NewTracing()
    if err != nil { return fmt.Errorf("failed to create tracing EVM: %w", err) }
    defer vm.Destroy()

    // Use a deterministic caller and contract address
    caller, _ := primitives.AddressFromHex("0x1000000000000000000000000000000000000000")
    contract, _ := primitives.AddressFromHex("0x1000000000000000000000000000000000000001")
    // Fund caller
    if err := vm.SetBalance(caller, big.NewInt(1_000_000_000_000_000_000)); err != nil {
        return fmt.Errorf("failed to set balance: %w", err)
    }
    // Set code at contract
    if err := vm.SetCode(contract, bytecode); err != nil {
        return fmt.Errorf("failed to set code: %w", err)
    }

    res, err := vm.Call(evm.Call{
        Caller: caller,
        To:     contract,
        Value:  big.NewInt(0),
        Input:  calldata,
        Gas:    gas,
    })
    if err != nil { return fmt.Errorf("call failed: %w", err) }

    if len(res.TraceJSON) == 0 {
        return fmt.Errorf("no trace produced")
    }
    if err := os.WriteFile(outPath, res.TraceJSON, 0o644); err != nil {
        return fmt.Errorf("failed to write %s: %w", outPath, err)
    }
    fmt.Fprintf(os.Stderr, "Wrote trace to %s (%d bytes)\n", outPath, len(res.TraceJSON))
    return nil
}

func parseHex(s string) ([]byte, error) {
	original := s
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "0x")
	s = strings.TrimPrefix(s, "0X")
	
	// Debug logging
	fmt.Fprintf(os.Stderr, "parseHex: original len=%d, after trim len=%d\n", len(original), len(s))
	if len(s) % 2 != 0 {
		fmt.Fprintf(os.Stderr, "WARNING: Odd number of hex chars: %d\n", len(s))
		// Pad with a zero if odd
		s = s + "0"
	}
	
	result, err := hex.DecodeString(s)
	if err != nil {
		fmt.Fprintf(os.Stderr, "hex.DecodeString error: %v\n", err)
	}
	return result, err
}

func runCompile(c *cli.Context) error {
	// Get source code - either from inline or file
	var source string
	var filename string
	
	if c.IsSet("source") {
		source = c.String("source")
		filename = "inline.sol"
	} else if c.IsSet("file") {
		filepath := c.String("file")
		content, err := os.ReadFile(filepath)
		if err != nil {
			return fmt.Errorf("failed to read source file: %w", err)
		}
		source = string(content)
		
		// Extract filename from path
		parts := strings.Split(filepath, "/")
		filename = parts[len(parts)-1]
	} else {
		return fmt.Errorf("either --source or --file must be provided")
	}
	
	// Setup compiler settings
	settings := compiler.CompilerSettings{
		OptimizerEnabled:       c.Bool("optimize"),
		OptimizerRuns:          uint32(c.Uint("optimize-runs")),
		EVMVersion:             c.String("evm-version"),
		OutputAbi:              true,
		OutputBytecode:         true,
		OutputDeployedBytecode: true,
		OutputAst:              false,
	}
	
	// Compile the source
	result, err := compiler.CompileSource(filename, source, settings)
	if err != nil {
		return fmt.Errorf("compilation failed: %w", err)
	}
	
	// Check for compilation errors
	if len(result.Errors) > 0 {
		fmt.Fprintf(os.Stderr, "Compilation errors:\n")
		for _, err := range result.Errors {
			fmt.Fprintf(os.Stderr, "  - %s\n", err)
		}
		if len(result.Contracts) == 0 {
			return fmt.Errorf("compilation failed with errors")
		}
	}
	
	// Show warnings if any
	if len(result.Warnings) > 0 {
		fmt.Fprintf(os.Stderr, "Warnings:\n")
		for _, warning := range result.Warnings {
			fmt.Fprintf(os.Stderr, "  - %s\n", warning)
		}
	}
	
	// Format output based on requested format
	var output string
	format := c.String("format")
	
	switch format {
	case "json":
		output, err = result.ToJSON()
		if err != nil {
			return fmt.Errorf("failed to format as JSON: %w", err)
		}
	case "hex":
		// Output just the bytecode in hex format
		if len(result.Contracts) > 0 {
			output = result.Contracts[0].Bytecode
		} else {
			return fmt.Errorf("no contracts compiled")
		}
	case "combined":
		// Output ABI and bytecode in a combined format
		if len(result.Contracts) > 0 {
			contract := result.Contracts[0]
			output = fmt.Sprintf("ABI:\n%s\n\nBytecode:\n%s\n\nDeployed Bytecode:\n%s\n",
				contract.ABI, contract.Bytecode, contract.DeployedBytecode)
		} else {
			return fmt.Errorf("no contracts compiled")
		}
	default:
		return fmt.Errorf("unsupported format: %s", format)
	}
	
	// Output to file or stdout
	outputPath := c.String("output")
	if outputPath != "" {
		if err := os.WriteFile(outputPath, []byte(output), 0644); err != nil {
			return fmt.Errorf("failed to write output file: %w", err)
		}
		fmt.Fprintf(os.Stderr, "Compilation result written to: %s\n", outputPath)
	} else {
		fmt.Print(output)
	}
	
	// Print summary to stderr
	fmt.Fprintf(os.Stderr, "\nCompiled %d contract(s) successfully\n", len(result.Contracts))
	for _, contract := range result.Contracts {
		fmt.Fprintf(os.Stderr, "  - %s\n", contract.Name)
	}
	
	return nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}