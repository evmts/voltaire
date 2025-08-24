//go:build mock
// +build mock

package main

// Stub implementations when building with --mock tag

type EVM2DataProvider struct{}

func NewEVM2DataProvider(bytecodeHex string, initialGas uint64) (*EVM2DataProvider, error) {
	return nil, nil
}

func NewEVM2DataProviderWithSample() (*EVM2DataProvider, error) {
	return nil, nil
}

func (e *EVM2DataProvider) GetState() *EVMState { return nil }
func (e *EVM2DataProvider) Step() error { return nil }
func (e *EVM2DataProvider) Run() error { return nil }
func (e *EVM2DataProvider) Pause() {}
func (e *EVM2DataProvider) Reset() {}
func (e *EVM2DataProvider) SetBreakpoint(pc uint64) {}
func (e *EVM2DataProvider) ClearBreakpoint(pc uint64) {}
func (e *EVM2DataProvider) IsBreakpoint(pc uint64) bool { return false }
func (e *EVM2DataProvider) GetNextOperation() *OperationPreview { return nil }
func (e *EVM2DataProvider) AddWatchedAddress(addr uint64, label string) {}
func (e *EVM2DataProvider) RemoveWatchedAddress(addr uint64) {}
func (e *EVM2DataProvider) GetRecentMemoryChanges(count int) []MemoryChange { return nil }
func (e *EVM2DataProvider) Cleanup() {}