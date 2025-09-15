package evm

import (
	"fmt"
	"math/big"

	guillotine "github.com/evmts/guillotine/sdks/go"
	"github.com/evmts/guillotine/sdks/go/primitives"
)

// ========================
// State Management Methods
// ========================

// SetBalance sets the balance of an address
func (evm *EVM) SetBalance(address primitives.Address, balance *big.Int) error {
	evm.mu.RLock()
	defer evm.mu.RUnlock()
	
	if evm.vm == nil {
		return fmt.Errorf("EVM instance has been closed")
	}
	
	return evm.vm.SetBalance(address.Array(), guillotine.BigIntToBytes32(balance))
}

// GetBalance gets the balance of an address
func (evm *EVM) GetBalance(address primitives.Address) (*big.Int, error) {
	evm.mu.RLock()
	defer evm.mu.RUnlock()
	
	if evm.vm == nil {
		return nil, fmt.Errorf("EVM instance has been closed")
	}
	
	bytes, err := evm.vm.GetBalance(address.Array())
	if err != nil {
		return nil, err
	}
	return guillotine.Bytes32ToBigInt(bytes), nil
}

// SetCode sets the code at an address
func (evm *EVM) SetCode(address primitives.Address, code []byte) error {
	evm.mu.RLock()
	defer evm.mu.RUnlock()
	
	if evm.vm == nil {
		return fmt.Errorf("EVM instance has been closed")
	}
	
	return evm.vm.SetCode(address.Array(), code)
}

// GetCode gets the code at an address
func (evm *EVM) GetCode(address primitives.Address) ([]byte, error) {
	evm.mu.RLock()
	defer evm.mu.RUnlock()
	
	if evm.vm == nil {
		return nil, fmt.Errorf("EVM instance has been closed")
	}
	
	return evm.vm.GetCode(address.Array())
}

// SetStorage sets a storage value at an address
func (evm *EVM) SetStorage(address primitives.Address, key, value *big.Int) error {
	evm.mu.RLock()
	defer evm.mu.RUnlock()
	
	if evm.vm == nil {
		return fmt.Errorf("EVM instance has been closed")
	}
	
	return evm.vm.SetStorage(address.Array(), guillotine.BigIntToBytes32(key), guillotine.BigIntToBytes32(value))
}

// GetStorage gets a storage value at an address
func (evm *EVM) GetStorage(address primitives.Address, key *big.Int) (*big.Int, error) {
	evm.mu.RLock()
	defer evm.mu.RUnlock()
	
	if evm.vm == nil {
		return nil, fmt.Errorf("EVM instance has been closed")
	}
	
	bytes, err := evm.vm.GetStorage(address.Array(), guillotine.BigIntToBytes32(key))
	if err != nil {
		return nil, err
	}
	return guillotine.Bytes32ToBigInt(bytes), nil
}