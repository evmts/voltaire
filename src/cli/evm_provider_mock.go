//go:build mock
// +build mock

package main

// Stub implementations when building with --mock tag

type EVMDataProvider struct{}

func NewEVMDataProvider(bytecodeHex string, initialGas uint64) (*EVMDataProvider, error) {
	return nil, nil
}

func NewEVMDataProviderWithSample() (*EVMDataProvider, error) {
	return nil, nil
}

func (e *EVMDataProvider) GetState() *EVMState { return nil }
func (e *EVMDataProvider) Step() error { return nil }
func (e *EVMDataProvider) Run() error { return nil }
func (e *EVMDataProvider) Pause() {}
func (e *EVMDataProvider) Reset() {}
func (e *EVMDataProvider) SetBreakpoint(pc uint64) {}
func (e *EVMDataProvider) ClearBreakpoint(pc uint64) {}
func (e *EVMDataProvider) IsBreakpoint(pc uint64) bool { return false }
func (e *EVMDataProvider) GetNextOperation() *OperationPreview { return nil }
func (e *EVMDataProvider) AddWatchedAddress(addr uint64, label string) {}
func (e *EVMDataProvider) RemoveWatchedAddress(addr uint64) {}
func (e *EVMDataProvider) GetRecentMemoryChanges(count int) []MemoryChange { return nil }
func (e *EVMDataProvider) Cleanup() {}