package main

import (
	"fmt"
)

// GuillotineDataProvider is a stub - the guillotine-go bindings are not working
type GuillotineDataProvider struct{}

// NewGuillotineDataProvider returns an error since guillotine-go bindings are broken
func NewGuillotineDataProvider(bytecodeHex string, initialGas uint64) (*GuillotineDataProvider, error) {
	return nil, fmt.Errorf("guillotine provider is not available - use --provider=evm or --mock instead")
}

// NewGuillotineDataProviderWithSample returns an error
func NewGuillotineDataProviderWithSample() (*GuillotineDataProvider, error) {
	return nil, fmt.Errorf("guillotine provider is not available - use --provider=evm or --mock instead")
}

// GetState returns nil
func (g *GuillotineDataProvider) GetState() *EVMState { return nil }

// Step returns an error
func (g *GuillotineDataProvider) Step() error {
	return fmt.Errorf("guillotine provider not implemented")
}

// Run returns an error
func (g *GuillotineDataProvider) Run() error {
	return fmt.Errorf("guillotine provider not implemented")
}

// Pause does nothing
func (g *GuillotineDataProvider) Pause() {}

// Reset does nothing
func (g *GuillotineDataProvider) Reset() {}

// SetBreakpoint does nothing
func (g *GuillotineDataProvider) SetBreakpoint(pc uint64) {}

// ClearBreakpoint does nothing
func (g *GuillotineDataProvider) ClearBreakpoint(pc uint64) {}

// IsBreakpoint returns false
func (g *GuillotineDataProvider) IsBreakpoint(pc uint64) bool { return false }

// GetNextOperation returns nil
func (g *GuillotineDataProvider) GetNextOperation() *OperationPreview { return nil }

// AddWatchedAddress does nothing
func (g *GuillotineDataProvider) AddWatchedAddress(addr uint64, label string) {}

// RemoveWatchedAddress does nothing
func (g *GuillotineDataProvider) RemoveWatchedAddress(addr uint64) {}

// GetRecentMemoryChanges returns nil
func (g *GuillotineDataProvider) GetRecentMemoryChanges(count int) []MemoryChange { return nil }

// Cleanup does nothing
func (g *GuillotineDataProvider) Cleanup() {}