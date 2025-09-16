package commands

import (
	"fmt"
	"math/big"
	"os"
	"path/filepath"

	"github.com/evmts/guillotine/sdks/go/evm"
	"github.com/evmts/guillotine/sdks/go/primitives"
	"github.com/urfave/cli/v2"
)

// RunTrace executes a CALL operation with tracing enabled and outputs JSON trace
func RunTrace(c *cli.Context) error {
	// Parse call parameters matching Guillotine's CallParams structure
	callerStr := c.String("caller")
	toStr := c.String("to")
	valueStr := c.String("value")
	gasStr := c.String("gas")
	
	// Handle special fixture shorthand
	if c.Args().Len() > 0 && c.Args().Get(0) == "snailtracer" {
		// Use snailtracer test fixture defaults
		projectRoot := "/Users/williamcory/Guillotine"
		
		// Read bytecode from fixture
		bytecodePath := filepath.Join(projectRoot, "src/_test_utils/fixtures/snailtracer/bytecode.txt")
		bcBytesRaw, err := os.ReadFile(bytecodePath)
		if err != nil {
			return fmt.Errorf("failed to read snailtracer bytecode: %w", err)
		}
		bytecode, err := ParseHex(string(bcBytesRaw))
		if err != nil {
			return fmt.Errorf("invalid snailtracer bytecode: %w", err)
		}
		
		// Read or get input/calldata
		var input []byte
		if inputStr := c.String("input"); inputStr != "" {
			// Use provided input
			input, err = ParseHex(inputStr)
			if err != nil {
				return fmt.Errorf("invalid input hex: %w", err)
			}
		} else {
			// Read default calldata from fixture
			calldataPath := filepath.Join(projectRoot, "src/_test_utils/fixtures/snailtracer/calldata.txt")
			cdBytesRaw, err := os.ReadFile(calldataPath)
			if err != nil {
				return fmt.Errorf("failed to read snailtracer calldata: %w", err)
			}
			input, err = ParseHex(string(cdBytesRaw))
			if err != nil {
				return fmt.Errorf("invalid snailtracer calldata: %w", err)
			}
		}
		
		// Set default addresses if not provided
		if callerStr == "" {
			callerStr = "0x1000000000000000000000000000000000000000"
		}
		if toStr == "" {
			toStr = "0x1000000000000000000000000000000000000001"
		}
		
		// Run snailtracer with special setup
		return runTraceWithSetup(callerStr, toStr, valueStr, input, gasStr, bytecode)
	}
	
	// Normal trace mode - require caller and to addresses
	if callerStr == "" {
		return fmt.Errorf("--caller is required (or use 'trace snailtracer' for test fixture)")
	}
	if toStr == "" {
		return fmt.Errorf("--to is required (or use 'trace snailtracer' for test fixture)")
	}
	
	// Parse input data
	var input []byte
	if inputStr := c.String("input"); inputStr != "" {
		var err error
		input, err = ParseHex(inputStr)
		if err != nil {
			return fmt.Errorf("invalid input hex: %w", err)
		}
	}
	
	// No special bytecode setup needed for regular trace
	return runTraceWithSetup(callerStr, toStr, valueStr, input, gasStr, nil)
}

// runTraceWithSetup executes a traced call with optional bytecode deployment
func runTraceWithSetup(callerStr, toStr, valueStr string, input []byte, gasStr string, deployBytecode []byte) error {
	// Parse addresses
	caller, err := primitives.AddressFromHex(callerStr)
	if err != nil {
		return fmt.Errorf("invalid caller address: %w", err)
	}
	
	to, err := primitives.AddressFromHex(toStr)
	if err != nil {
		return fmt.Errorf("invalid to address: %w", err)
	}
	
	// Parse value (default 0)
	value := big.NewInt(0)
	if valueStr != "" {
		value, _ = new(big.Int).SetString(valueStr, 10)
		if value == nil {
			return fmt.Errorf("invalid value: %s", valueStr)
		}
	}
	
	// Parse gas (default 10M)
	var gas uint64 = 10000000
	if gasStr != "" {
		if _, err := fmt.Sscanf(gasStr, "%d", &gas); err != nil {
			return fmt.Errorf("invalid gas: %w", err)
		}
	}
	
	// Create tracing EVM instance
	vm, err := evm.NewTracing()
	if err != nil {
		return fmt.Errorf("failed to create tracing EVM: %w", err)
	}
	defer vm.Destroy()
	
	// Setup: Fund caller
	if err := vm.SetBalance(caller, big.NewInt(1_000_000_000_000_000_000)); err != nil {
		return fmt.Errorf("failed to set caller balance: %w", err)
	}
	
	// Setup: Deploy bytecode if provided (for test fixtures)
	if deployBytecode != nil {
		if err := vm.SetCode(to, deployBytecode); err != nil {
			return fmt.Errorf("failed to set contract code: %w", err)
		}
	}
	
	// Execute CALL with tracing
	res, err := vm.Call(evm.Call{
		Caller: caller,
		To:     to,
		Value:  value,
		Input:  input,
		Gas:    gas,
	})
	if err != nil {
		return fmt.Errorf("call execution failed: %w", err)
	}
	
	// Output JSON trace to stdout
	if len(res.TraceJSON) == 0 {
		fmt.Print("{}") // Empty trace
	} else {
		os.Stdout.Write(res.TraceJSON)
	}
	
	return nil
}