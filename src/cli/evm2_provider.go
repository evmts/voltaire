//go:build !mock
// +build !mock

package main

import (
	"encoding/hex"
	"fmt"
	"path/filepath"
	"runtime"
)

// EVM2DataProvider implements the data provider interface using the real EVM2 C API
type EVM2DataProvider struct {
	frame *EVM2Frame
}

// NewEVM2DataProvider creates a new EVM2-based data provider
func NewEVM2DataProvider(bytecodeHex string, initialGas uint64) (*EVM2DataProvider, error) {
	// Parse hex bytecode
	if bytecodeHex[:2] == "0x" {
		bytecodeHex = bytecodeHex[2:]
	}
	
	bytecode, err := hex.DecodeString(bytecodeHex)
	if err != nil {
		return nil, fmt.Errorf("invalid bytecode hex: %w", err)
	}
	
	// Create EVM2 frame
	frame, err := NewEVM2Frame(bytecode, initialGas)
	if err != nil {
		return nil, fmt.Errorf("failed to create EVM2 frame: %w", err)
	}
	
	return &EVM2DataProvider{
		frame: frame,
	}, nil
}

// NewEVM2DataProviderFromBytes creates a provider from raw bytecode
func NewEVM2DataProviderFromBytes(bytecode []byte, initialGas uint64) (*EVM2DataProvider, error) {
	frame, err := NewEVM2Frame(bytecode, initialGas)
	if err != nil {
		return nil, fmt.Errorf("failed to create EVM2 frame: %w", err)
	}
	
	return &EVM2DataProvider{
		frame: frame,
	}, nil
}

// NewEVM2DataProviderWithSample creates a provider with sample bytecode for demo
func NewEVM2DataProviderWithSample() (*EVM2DataProvider, error) {
	// Sample bytecode: PUSH1 0x20, PUSH1 0x40, ADD, PUSH1 0x10, SUB, STOP
	bytecode := []byte{0x60, 0x20, 0x60, 0x40, 0x01, 0x60, 0x10, 0x03, 0x00}
	
	return NewEVM2DataProviderFromBytes(bytecode, 1000000)
}

// Cleanup releases resources
func (p *EVM2DataProvider) Cleanup() {
	if p.frame != nil {
		p.frame.Destroy()
		p.frame = nil
	}
}

// GetState returns the current EVM state
func (p *EVM2DataProvider) GetState() *EVMState {
	if p.frame == nil {
		return &EVMState{
			Status: StatusError,
			Error:  "EVM2 frame not initialized",
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
func (p *EVM2DataProvider) Step() error {
	if p.frame == nil {
		return fmt.Errorf("EVM2 frame not initialized")
	}
	
	return p.frame.Step()
}

// Run executes until completion or error
func (p *EVM2DataProvider) Run() error {
	if p.frame == nil {
		return fmt.Errorf("EVM2 frame not initialized")
	}
	
	return p.frame.Run()
}

// Pause pauses execution
func (p *EVM2DataProvider) Pause() {
	if p.frame != nil {
		p.frame.Pause()
	}
}

// Reset resets the execution state
func (p *EVM2DataProvider) Reset() {
	if p.frame != nil {
		if err := p.frame.Reset(); err != nil {
			// Log error but don't fail - UI expects this to always work
			fmt.Printf("Warning: EVM2 reset failed: %v\n", err)
		}
	}
}

// SetBreakpoint sets a breakpoint at the given PC
func (p *EVM2DataProvider) SetBreakpoint(pc uint64) {
	if p.frame != nil {
		p.frame.SetBreakpoint(pc)
	}
}

// ClearBreakpoint clears a breakpoint at the given PC
func (p *EVM2DataProvider) ClearBreakpoint(pc uint64) {
	if p.frame != nil {
		p.frame.ClearBreakpoint(pc)
	}
}

// IsBreakpoint checks if there's a breakpoint at the given PC
func (p *EVM2DataProvider) IsBreakpoint(pc uint64) bool {
	if p.frame == nil {
		return false
	}
	return p.frame.IsBreakpoint(pc)
}

// GetNextOperation returns preview of what the next step will do
func (p *EVM2DataProvider) GetNextOperation() *OperationPreview {
	if p.frame == nil {
		return nil
	}
	return p.frame.GetNextOperation()
}

// AddWatchedAddress adds a new address to watch
func (p *EVM2DataProvider) AddWatchedAddress(addr uint64, label string) {
	if p.frame != nil {
		p.frame.AddWatchedAddress(addr, label)
	}
}

// RemoveWatchedAddress removes an address from watch list
func (p *EVM2DataProvider) RemoveWatchedAddress(addr uint64) {
	if p.frame != nil {
		p.frame.RemoveWatchedAddress(addr)
	}
}

// GetRecentMemoryChanges returns the most recent memory changes
func (p *EVM2DataProvider) GetRecentMemoryChanges(count int) []MemoryChange {
	if p.frame == nil {
		return []MemoryChange{}
	}
	return p.frame.GetRecentMemoryChanges(count)
}

// GetLibraryInfo returns information about the EVM2 library
func (p *EVM2DataProvider) GetLibraryInfo() (version, buildInfo string) {
	return GetEVM2Version(), GetEVM2BuildInfo()
}

// BuildInfo provides information about how to build the required libraries
func BuildInfo() string {
	_, currentFile, _, _ := runtime.Caller(0)
	baseDir := filepath.Dir(filepath.Dir(currentFile)) // Go up to Guillotine root
	
	return fmt.Sprintf(`
EVM2 Go Integration Build Instructions:
======================================

1. Build the EVM2 C libraries:
   cd %s
   zig build evm2-c

2. Update CGO flags if needed:
   The Go bindings expect the library at:
   - Headers: ../../evm2/evm2_c.h  
   - Library: ../../.zig-cache/o/*/libevm2_c.a

3. Build the CLI:
   cd src/cli
   CGO_ENABLED=1 go build -o evm-debugger .

4. Run with EVM2:
   ./evm-debugger --use-evm2

Environment Variables:
- CGO_ENABLED=1         (required for C bindings)  
- CGO_CFLAGS            (additional C compiler flags)
- CGO_LDFLAGS           (additional linker flags)

Library Information:
- Version: %s
- Build Info: %s
`, baseDir, GetEVM2Version(), GetEVM2BuildInfo())
}