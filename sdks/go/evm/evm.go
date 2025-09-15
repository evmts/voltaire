package evm

import (
	"sync"

	guillotine "github.com/evmts/guillotine/sdks/go"
)

// ========================
// EVM Instance
// ========================

// EVM represents an instance of the Ethereum Virtual Machine
type EVM struct {
	vm *guillotine.VMHandle
	mu sync.RWMutex
}