package main

import (
	"encoding/hex"
	"fmt"
	"path/filepath"
	"runtime"
)

// EVMDataProvider implements the data provider interface using the real EVM C API
type EVMDataProvider struct {
	frame *EVMFrame
}

// NewEVMDataProvider creates a new EVM-based data provider
func NewEVMDataProvider(bytecodeHex string, initialGas uint64) (*EVMDataProvider, error) {
	// Parse hex bytecode
	if bytecodeHex[:2] == "0x" {
		bytecodeHex = bytecodeHex[2:]
	}
	
	bytecode, err := hex.DecodeString(bytecodeHex)
	if err != nil {
		return nil, fmt.Errorf("invalid bytecode hex: %w", err)
	}
	
	// Create EVM frame
	frame, err := NewEVMFrame(bytecode, initialGas)
	if err != nil {
		return nil, fmt.Errorf("failed to create EVM frame: %w", err)
	}
	
	return &EVMDataProvider{
		frame: frame,
	}, nil
}

// NewEVMDataProviderFromBytes creates a provider from raw bytecode
func NewEVMDataProviderFromBytes(bytecode []byte, initialGas uint64) (*EVMDataProvider, error) {
	frame, err := NewEVMFrame(bytecode, initialGas)
	if err != nil {
		return nil, fmt.Errorf("failed to create EVM frame: %w", err)
	}
	
	return &EVMDataProvider{
		frame: frame,
	}, nil
}

// NewEVMDataProviderWithSample creates a provider with sample bytecode for demo
func NewEVMDataProviderWithSample() (*EVMDataProvider, error) {
	// Sample bytecode: PUSH1 0x20, PUSH1 0x40, ADD, PUSH1 0x10, SUB, STOP
	bytecode := []byte{0x60, 0x20, 0x60, 0x40, 0x01, 0x60, 0x10, 0x03, 0x00}
	
	return NewEVMDataProviderFromBytes(bytecode, 1000000)
}

// Cleanup releases resources
func (p *EVMDataProvider) Cleanup() {
	if p.frame != nil {
		p.frame.Destroy()
		p.frame = nil
	}
}

// GetState returns the current EVM state
func (p *EVMDataProvider) GetState() *EVMState {
	if p.frame == nil {
		return &EVMState{
			Status: StatusError,
			Error:  "EVM frame not initialized",
		}
	}
	
	state := p.frame.GetState()
	
	// Add some additional metadata
	if state.Error == "" && state.Status == StatusCompleted {
		state.Error = "" // Ensure no error for successful completion
	}
	
	return state
}

// Step executes one instruction
func (p *EVMDataProvider) Step() error {
	if p.frame == nil {
		return fmt.Errorf("EVM frame not initialized")
	}
	
	return p.frame.Step()
}

// Run executes until completion or error
func (p *EVMDataProvider) Run() error {
	if p.frame == nil {
		return fmt.Errorf("EVM frame not initialized")
	}
	
	return p.frame.Run()
}

// Pause pauses execution
func (p *EVMDataProvider) Pause() {
	if p.frame != nil {
		p.frame.Pause()
	}
}

// Reset resets the execution state
func (p *EVMDataProvider) Reset() {
	if p.frame != nil {
		if err := p.frame.Reset(); err != nil {
			// Log error but don't fail - UI expects this to always work
			fmt.Printf("Warning: EVM reset failed: %v\n", err)
		}
	}
}

// SetBreakpoint sets a breakpoint at the given PC
func (p *EVMDataProvider) SetBreakpoint(pc uint64) {
	if p.frame != nil {
		p.frame.SetBreakpoint(pc)
	}
}

// ClearBreakpoint clears a breakpoint at the given PC
func (p *EVMDataProvider) ClearBreakpoint(pc uint64) {
	if p.frame != nil {
		p.frame.ClearBreakpoint(pc)
	}
}

// IsBreakpoint checks if there's a breakpoint at the given PC
func (p *EVMDataProvider) IsBreakpoint(pc uint64) bool {
	if p.frame == nil {
		return false
	}
	return p.frame.IsBreakpoint(pc)
}

// GetNextOperation returns preview of what the next step will do
func (p *EVMDataProvider) GetNextOperation() *OperationPreview {
	if p.frame == nil {
		return nil
	}
	return p.frame.GetNextOperation()
}

// AddWatchedAddress adds a new address to watch
func (p *EVMDataProvider) AddWatchedAddress(addr uint64, label string) {
	if p.frame != nil {
		p.frame.AddWatchedAddress(addr, label)
	}
}

// RemoveWatchedAddress removes an address from watch list
func (p *EVMDataProvider) RemoveWatchedAddress(addr uint64) {
	if p.frame != nil {
		p.frame.RemoveWatchedAddress(addr)
	}
}

// GetRecentMemoryChanges returns the most recent memory changes
func (p *EVMDataProvider) GetRecentMemoryChanges(count int) []MemoryChange {
	if p.frame == nil {
		return []MemoryChange{}
	}
	return p.frame.GetRecentMemoryChanges(count)
}

// GetLibraryInfo returns information about the EVM library
func (p *EVMDataProvider) GetLibraryInfo() (version, buildInfo string) {
	return GetEVMVersion(), GetEVMBuildInfo()
}

// BuildInfo provides information about how to build the required libraries
func BuildInfo() string {
	_, currentFile, _, _ := runtime.Caller(0)
	baseDir := filepath.Dir(filepath.Dir(currentFile)) // Go up to Guillotine root
	
	return fmt.Sprintf(`
EVM Go Integration Build Instructions:
======================================

1. Build the EVM C libraries:
   cd %s
   zig build evm-c

2. Update CGO flags if needed:
   The Go bindings expect the library at:
   - Headers: ../../evm/evm_c.h  
   - Library: ../../.zig-cache/o/*/libevm_c.a

3. Build the CLI:
   cd src/cli
   CGO_ENABLED=1 go build -o evm-debugger .

4. Run with EVM:
   ./evm-debugger --use-evm

Environment Variables:
- CGO_ENABLED=1         (required for C bindings)  
- CGO_CFLAGS            (additional C compiler flags)
- CGO_LDFLAGS           (additional linker flags)

Library Information:
- Version: %s
- Build Info: %s
`, baseDir, GetEVMVersion(), GetEVMBuildInfo())
}