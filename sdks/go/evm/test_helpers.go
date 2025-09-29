package evm

import (
	"math/big"
	"testing"

	"github.com/evmts/guillotine/sdks/go/primitives"
	"github.com/stretchr/testify/require"
)

const (
	DefaultBalance = 1000000000000000000 // 1 ETH in wei
	StandardGas    = 30000000            // Standard gas limit for tests
	HighGas        = 100000000            // High gas limit
	VeryHighGas    = 1000000000           // Very high gas limit
	ExtremeGas     = 3000000000           // Extreme gas limit
	CallValue      = 1000000000000000     // 0.001 ETH in wei
)

// LargeBalance is 10 ETH - too large for int64, so use a var
var LargeBalance = new(big.Int).Mul(big.NewInt(10), big.NewInt(1000000000000000000))

// Helper function to create a test EVM instance
func createTestEVM(t *testing.T) *TestEVM {
	evm, err := New()
	require.NoError(t, err)
	require.NotNil(t, evm)
	return &TestEVM{EVM: evm, t: t}
}

// TestEVM wraps EVM with test-friendly methods
type TestEVM struct {
	*EVM
	t *testing.T
}

// Destroy wraps the EVM Destroy method
func (e *TestEVM) Destroy() {
	e.EVM.Destroy()
}

// Execute runs bytecode with default parameters
func (e *TestEVM) Execute(bytecode []byte) *TestExecutionResult {
	// Deploy the bytecode first
	result, err := e.EVM.Call(Create{
		Caller:   primitives.Address{},
		Value:    big.NewInt(0),
		InitCode: bytecode,
		Gas:      10000000,
	})
	
	if err != nil {
		return &TestExecutionResult{
			Success: false,
			GasUsed: 0,
			Output:  []byte{},
		}
	}
	
	return &TestExecutionResult{
		Success: result.Success,
		GasUsed: 10000000 - result.GasLeft,
		Output:  result.Output,
	}
}

// ExecuteWithAddress runs bytecode from a specific address
func (e *TestEVM) ExecuteWithAddress(bytecode []byte, addr *primitives.Address) *TestExecutionResult {
	// Set the code at the address first
	e.SetCode(addr, bytecode)
	
	// Call the code
	result, err := e.EVM.Call(Call{
		Caller: *addr,
		To:     *addr,
		Value:  big.NewInt(0),
		Input:  []byte{},
		Gas:    10000000,
	})
	
	if err != nil {
		return &TestExecutionResult{
			Success: false,
			GasUsed: 0,
			Output:  []byte{},
		}
	}
	
	return &TestExecutionResult{
		Success: result.Success,
		GasUsed: 10000000 - result.GasLeft,
		Output:  result.Output,
	}
}

// SetBalance sets the balance of an address
func (e *TestEVM) SetBalance(addr *primitives.Address, balance *big.Int) {
	err := e.EVM.SetBalance(*addr, balance)
	require.NoError(e.t, err)
}

// GetBalance gets the balance of an address
func (e *TestEVM) GetBalance(addr *primitives.Address) *big.Int {
	balance, err := e.EVM.GetBalance(*addr)
	require.NoError(e.t, err)
	return balance
}

// SetCode sets the code of an address
func (e *TestEVM) SetCode(addr *primitives.Address, code []byte) {
	err := e.EVM.SetCode(*addr, code)
	require.NoError(e.t, err)
}

// GetCode gets the code of an address
func (e *TestEVM) GetCode(addr *primitives.Address) []byte {
	code, err := e.EVM.GetCode(*addr)
	require.NoError(e.t, err)
	return code
}

// SetStorage sets a storage value
func (e *TestEVM) SetStorage(addr *primitives.Address, key *big.Int, value *big.Int) {
	err := e.EVM.SetStorage(*addr, key, value)
	require.NoError(e.t, err)
}

// GetStorage gets a storage value
func (e *TestEVM) GetStorage(addr *primitives.Address, key *big.Int) *big.Int {
	value, err := e.EVM.GetStorage(*addr, key)
	require.NoError(e.t, err)
	return value
}

// SetGasLimit sets the gas limit (stored in test context)
func (e *TestEVM) SetGasLimit(limit *big.Int) {
	// This would need to be implemented in the actual execution
	// For now, we'll ignore it as the Execute method uses a fixed gas limit
}

// SetNonce sets the nonce (not directly supported, would need state management)
func (e *TestEVM) SetNonce(addr *primitives.Address, nonce uint64) {
	// Not directly supported in current implementation
}

// SetBlockTimestamp sets the block timestamp (not directly supported)
func (e *TestEVM) SetBlockTimestamp(timestamp *big.Int) {
	// Not directly supported in current implementation
}

// TestExecutionResult wraps the execution result for tests
type TestExecutionResult struct {
	Success bool
	GasUsed uint64
	Output  []byte
}

// Helper to create primitives
func NewAddress(bytes [20]byte) primitives.Address {
	return primitives.NewAddress(bytes)
}

func NewBigIntFromUint64(v uint64) *big.Int {
	return big.NewInt(int64(v))
}

func NewBigIntFromBytes(bytes []byte) *big.Int {
	return new(big.Int).SetBytes(bytes)
}

func NewBigIntFromHex(hex string) *big.Int {
	n := new(big.Int)
	n.SetString(hex, 16)
	return n
}

func NewHash(bytes [32]byte) primitives.Hash {
	return primitives.NewHash(bytes)
}