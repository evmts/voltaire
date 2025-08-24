package main

// DataProvider interface defines the common interface for both Mock and EVM providers
type DataProvider interface {
	// State management
	GetState() *EVMState
	
	// Execution control
	Step() error
	Run() error
	Pause()
	Reset()
	
	// Breakpoints
	SetBreakpoint(pc uint64)
	ClearBreakpoint(pc uint64)
	IsBreakpoint(pc uint64) bool
	
	// Operation preview
	GetNextOperation() *OperationPreview
	
	// Memory watching
	AddWatchedAddress(addr uint64, label string)
	RemoveWatchedAddress(addr uint64)
	GetRecentMemoryChanges(count int) []MemoryChange
}