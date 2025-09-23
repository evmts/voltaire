package commands

import (
	"fmt"
	"math/big"
	"os"

	"github.com/evmts/guillotine/sdks/go/evm"
	"github.com/evmts/guillotine/sdks/go/primitives"
	"github.com/urfave/cli/v2"
)

// RunTrace executes a CALL operation with tracing enabled and outputs JSON trace
func RunTrace(c *cli.Context) error {
	return RunTraceWithOutput(c, "")
}

// RunTraceWithOutput executes a CALL operation with tracing enabled and outputs to file or stdout
func RunTraceWithOutput(c *cli.Context, outputPath string) error {
	// Check if a fixture name is provided as positional argument
	if c.Args().Len() > 0 {
		fixtureName := c.Args().Get(0)
		
		// Load bytecode and calldata from fixture
		bytecode, calldata, err := LoadFixtureBytecodeAndCalldata(fixtureName)
		if err != nil {
			return fmt.Errorf("failed to load fixture '%s': %w", fixtureName, err)
		}
		
		// Get caller and to addresses (use defaults if not provided)
		callerStr := c.String("caller")
		if callerStr == "" {
			callerStr = "0x1000000000000000000000000000000000000000"
		}
		
		toStr := c.String("to")
		if toStr == "" {
			toStr = "0x1000000000000000000000000000000000000001"
		}
		
		// Override calldata if input is explicitly provided
		input := calldata
		if inputStr := c.String("input"); inputStr != "" {
			input, err = ParseHex(inputStr)
			if err != nil {
				return fmt.Errorf("invalid input hex: %w", err)
			}
		}
		
		valueStr := c.String("value")
		gasStr := c.String("gas")
		
		// Run with fixture setup
		return runTraceWithSetup(callerStr, toStr, valueStr, input, gasStr, bytecode)
	}
	
	// Normal trace mode - require caller and to addresses
	callerStr := c.String("caller")
	if callerStr == "" {
		return fmt.Errorf("--caller is required (or use 'trace <fixture-name>' for test fixture)")
	}
	
	toStr := c.String("to")
	if toStr == "" {
		return fmt.Errorf("--to is required (or use 'trace <fixture-name>' for test fixture)")
	}
	
	valueStr := c.String("value")
	gasStr := c.String("gas")
	
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
	return RunTraceWithSetupToFile(callerStr, toStr, valueStr, input, gasStr, deployBytecode, "")
}

// RunTraceWithSetupToFile executes a traced call with optional bytecode deployment and file output (exported for differential)
func RunTraceWithSetupToFile(callerStr, toStr, valueStr string, input []byte, gasStr string, deployBytecode []byte, outputPath string) error {
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
	
	// Output JSON trace
	if outputPath != "" {
		// Write to file
		if len(res.TraceJSON) == 0 {
			return os.WriteFile(outputPath, []byte("{}"), 0644)
		}
		return os.WriteFile(outputPath, res.TraceJSON, 0644)
	} else {
		// Write to stdout
		if len(res.TraceJSON) == 0 {
			fmt.Print("{}") // Empty trace
		} else {
			os.Stdout.Write(res.TraceJSON)
		}
	}
	
	return nil
}