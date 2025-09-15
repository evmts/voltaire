package commands

import (
	"fmt"
	"math/big"
	"os"

	"github.com/evmts/guillotine/sdks/go/evm"
	"github.com/evmts/guillotine/sdks/go/primitives"
	"github.com/urfave/cli/v2"
)

// RunTrace executes and writes JSON-RPC trace to a file
func RunTrace(c *cli.Context) error {
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
	bytecode, err := ParseHex(string(bcBytesRaw))
	if err != nil { return fmt.Errorf("invalid bytecode hex: %w", err) }

	cdBytesRaw, err := os.ReadFile(calldataPath)
	if err != nil { return fmt.Errorf("failed to read calldata: %w", err) }
	calldata, err := ParseHex(string(cdBytesRaw))
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