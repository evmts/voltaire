package commands

import (
	"fmt"

	"github.com/evmts/guillotine/sdks/go/evm"
	"github.com/urfave/cli/v2"
)

// ExecuteCallcode executes a CALLCODE operation
func ExecuteCallcode(c *cli.Context) error {
	params, err := ParseCallParams(c, true) // needValue = true
	if err != nil {
		return err
	}
	
	vm, err := SetupEVM(c)
	if err != nil {
		return err
	}
	defer vm.Destroy()
	
	if err := ExecuteWithBalance(vm, params.Caller, params.Value); err != nil {
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
	
	return OutputResult(c, result)
}