package evm

import (
	"fmt"
	"runtime"

	guillotine "github.com/evmts/guillotine/sdks/go"
)

// ========================
// Constructors and Lifecycle
// ========================

// New creates a new EVM instance
func New() (*EVM, error) {
	vm, err := guillotine.NewVMHandle()
	if err != nil {
		return nil, fmt.Errorf("failed to create EVM instance: %w", err)
	}
	
	evm := &EVM{vm: vm}
	runtime.SetFinalizer(evm, (*EVM).finalize)
	return evm, nil
}

// NewTracing creates a new EVM instance with JSON-RPC tracing enabled
func NewTracing() (*EVM, error) {
	vm, err := guillotine.NewTracingVMHandle()
	if err != nil {
		return nil, fmt.Errorf("failed to create tracing EVM instance: %w", err)
	}
	e := &EVM{vm: vm}
	runtime.SetFinalizer(e, (*EVM).finalize)
	return e, nil
}

// finalize is called by the garbage collector
func (evm *EVM) finalize() {
	_ = evm.Destroy()
}

// Destroy closes and cleans up the EVM instance
func (evm *EVM) Destroy() error {
	evm.mu.Lock()
	defer evm.mu.Unlock()
	
	if evm.vm != nil {
		err := evm.vm.Destroy()
		evm.vm = nil
		runtime.SetFinalizer(evm, nil)
		return err
	}
	return nil
}