package commands

import (
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/urfave/cli/v2"
	"github.com/evmts/guillotine/sdks/go/dispatch"
)

// ExecuteDispatch pretty prints EVM bytecode dispatch schedule
func ExecuteDispatch(c *cli.Context) error {
	if c.NArg() < 1 {
		return fmt.Errorf("bytecode source required (fixture name, file path, or hex string)")
	}
	
	source := c.Args().Get(0)
	
	// Try to get bytecode from different sources (reuse existing helper)
	bytecodeHex, err := getBytecodeFromSource(source)
	if err != nil {
		return fmt.Errorf("failed to get bytecode: %w", err)
	}
	
	// Convert hex string to bytes
	bytecodeHex = strings.TrimPrefix(bytecodeHex, "0x")
	bytecodeHex = strings.TrimPrefix(bytecodeHex, "0X")
	
	bytecodeBytes, err := hex.DecodeString(bytecodeHex)
	if err != nil {
		return fmt.Errorf("failed to decode bytecode hex: %w", err)
	}
	
	// Use the Zig dispatch pretty print function via FFI
	output, err := dispatch.PrettyPrint(bytecodeBytes)
	if err != nil {
		return fmt.Errorf("failed to pretty print dispatch schedule: %w", err)
	}
	
	// Output the result
	fmt.Println(output)
	
	return nil
}