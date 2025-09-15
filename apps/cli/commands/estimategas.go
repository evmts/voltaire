package commands

import (
	"fmt"

	guillotine "github.com/evmts/guillotine/sdks/go"
	"github.com/evmts/guillotine/sdks/go/evm"
	"github.com/evmts/guillotine/sdks/go/primitives"
	"github.com/urfave/cli/v2"
)

// ExecuteEstimateGas estimates gas for a transaction (eth_estimateGas compatible)
func ExecuteEstimateGas(c *cli.Context) error {
	// Parse JSON-RPC style parameters
	from, err := ParseAddress(c.String("from"))
	if err != nil {
		return fmt.Errorf("invalid from address: %w", err)
	}
	
	var to primitives.Address
	if c.IsSet("to") {
		to, err = ParseAddress(c.String("to"))
		if err != nil {
			return fmt.Errorf("invalid to address: %w", err)
		}
	}
	
	value, err := ParseBigInt(c.String("value"))
	if err != nil {
		return fmt.Errorf("invalid value: %w", err)
	}
	
	data, err := ParseHex(c.String("data"))
	if err != nil {
		return fmt.Errorf("invalid data: %w", err)
	}
	
	// Setup EVM
	vm, err := SetupEVM(c)
	if err != nil {
		return err
	}
	defer vm.Destroy()
	
	// Ensure from has balance
	if err := ExecuteWithBalance(vm, from, value); err != nil {
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