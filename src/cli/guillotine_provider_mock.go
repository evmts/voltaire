//go:build mock
// +build mock

package main

// Stub implementations when building with --mock tag

type GuillotineDataProvider struct{}

func NewGuillotineDataProvider(bytecodeHex string, initialGas uint64) (*GuillotineDataProvider, error) {
	return nil, nil
}

func NewGuillotineDataProviderWithSample() (*GuillotineDataProvider, error) {
	return nil, nil
}

func (g *GuillotineDataProvider) GetState() *EVMState { return nil }
func (g *GuillotineDataProvider) Step() error { return nil }
func (g *GuillotineDataProvider) Run() error { return nil }
func (g *GuillotineDataProvider) Pause() {}
func (g *GuillotineDataProvider) Reset() {}
func (g *GuillotineDataProvider) SetBreakpoint(pc uint64) {}
func (g *GuillotineDataProvider) ClearBreakpoint(pc uint64) {}
func (g *GuillotineDataProvider) IsBreakpoint(pc uint64) bool { return false }
func (g *GuillotineDataProvider) GetNextOperation() *OperationPreview { return nil }
func (g *GuillotineDataProvider) AddWatchedAddress(addr uint64, label string) {}
func (g *GuillotineDataProvider) RemoveWatchedAddress(addr uint64) {}
func (g *GuillotineDataProvider) GetRecentMemoryChanges(count int) []MemoryChange { return nil }
func (g *GuillotineDataProvider) Cleanup() {}