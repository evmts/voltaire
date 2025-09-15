package commands

import (
	"fmt"

	"github.com/evmts/guillotine/sdks/go/evm"
	"github.com/urfave/cli/v2"
)

// ExecuteCreate2 executes a CREATE2 operation
func ExecuteCreate2(c *cli.Context) error {
	params, err := ParseCreateParams(c, true) // needSalt = true
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
	
	return OutputResult(c, result)
}