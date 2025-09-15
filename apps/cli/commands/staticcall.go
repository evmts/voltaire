package commands

import (
	"fmt"

	"github.com/evmts/guillotine/sdks/go/evm"
	"github.com/urfave/cli/v2"
)

// ExecuteStaticcall executes a STATICCALL operation
func ExecuteStaticcall(c *cli.Context) error {
	params, err := ParseCallParams(c, false) // needValue = false
	if err != nil {
		return err
	}
	
	vm, err := SetupEVM(c)
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
	
	return OutputResult(c, result)
}