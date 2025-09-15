package commands

import (
	"fmt"

	"github.com/evmts/guillotine/sdks/go/evm"
	"github.com/urfave/cli/v2"
)

// ExecuteCreate executes a CREATE operation
func ExecuteCreate(c *cli.Context) error {
	params, err := ParseCreateParams(c, false) // needSalt = false
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
	
	result, err := vm.Call(evm.Create{
		Caller:   params.Caller,
		Value:    params.Value,
		InitCode: params.InitCode,
		Gas:      params.Gas,
	})
	if err != nil {
		return fmt.Errorf("create execution failed: %w", err)
	}
	
	return OutputResult(c, result)
}