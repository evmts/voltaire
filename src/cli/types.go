package main

import (
	"encoding/hex"
	"fmt"
	"math/big"
)

// EVMState represents the current state of the EVM execution
type EVMState struct {
	PC               uint64
	Gas              uint64
	MaxGas           uint64
	Status           ExecutionStatus
	Stack            []StackItem
	Memory           []byte
	Bytecode         []byte
	Instructions     []Instruction
	BasicBlocks      []BasicBlock
	ExecutionHistory []ExecutionStep
	WatchedAddresses []WatchedAddress
	Profile          ExecutionProfile
	SourceMap        SourceMapping
	Error            string
}

// ExecutionStatus represents the current execution state
type ExecutionStatus int

const (
	StatusStopped ExecutionStatus = iota
	StatusRunning
	StatusPaused
	StatusError
	StatusCompleted
)

func (s ExecutionStatus) String() string {
	switch s {
	case StatusStopped:
		return "Stopped"
	case StatusRunning:
		return "Running"
	case StatusPaused:
		return "Paused"
	case StatusError:
		return "Error"
	case StatusCompleted:
		return "Completed"
	default:
		return "Unknown"
	}
}

// StackItem represents a single item on the EVM stack
type StackItem struct {
	Value *big.Int
	Index int
}

func (s StackItem) String() string {
	return fmt.Sprintf("0x%064x", s.Value)
}

// Instruction represents a disassembled bytecode instruction
type Instruction struct {
	PC          uint64
	Opcode      byte
	Name        string
	Args        []byte
	Gas         uint64
	StackPops   int
	StackPushes int
	Description string
	BasicBlock  int
}

func (i Instruction) String() string {
	if len(i.Args) > 0 {
		return fmt.Sprintf("%s 0x%s", i.Name, hex.EncodeToString(i.Args))
	}
	return i.Name
}

// BasicBlock represents a sequence of instructions with no jumps
type BasicBlock struct {
	ID           int
	StartPC      uint64
	EndPC        uint64
	Instructions []Instruction
	TotalGas     uint64
	HitCount     int
}

// ExecutionStep represents a single step in execution history
type ExecutionStep struct {
	StepNumber   int
	PC           uint64
	Opcode       byte
	OpcodeName   string
	GasBefore    uint64
	GasAfter     uint64
	StackBefore  []StackItem
	StackAfter   []StackItem
	MemoryChange *MemoryChange
}

// MemoryChange represents a change in memory
type MemoryChange struct {
	Address    uint64
	OldValue   byte
	NewValue   byte
	StepNumber int
}

// WatchedAddress represents a memory address being watched
type WatchedAddress struct {
	Address uint64
	Label   string
	Changes []MemoryChange
}

// ExecutionProfile contains execution analytics
type ExecutionProfile struct {
	TotalSteps        int
	InstructionCounts map[string]int
	GasUsage          map[string]uint64
	BasicBlockHits    map[int]int
	HotspotPCs        []uint64
	MaxStackSize      int
	TotalGasUsed      uint64
}

// SourceMapping contains the mapping between bytecode and Solidity source
type SourceMapping struct {
	SourceFile      string
	SourceCode      string
	Mappings        map[uint64]SourceLocation // PC -> source location
	Functions       []FunctionInfo
	CurrentFunction *FunctionInfo
}

// SourceLocation represents a location in the source code
type SourceLocation struct {
	Start      int    // Character offset in source
	Length     int    // Length of the region
	Line       int    // Line number (1-based)
	Column     int    // Column number (1-based)
	SourceText string // The actual source text
	Context    string // Additional context (function name, etc.)
}

// FunctionInfo contains information about a Solidity function
type FunctionInfo struct {
	Name            string
	Selector        [4]byte
	StartPC         uint64
	EndPC           uint64
	SourceLoc       SourceLocation
	Visibility      string // public, private, internal, external
	StateMutability string // pure, view, payable, nonpayable
}

// OperationPreview represents a preview of the next operation
type OperationPreview struct {
	Instruction  Instruction
	StackBefore  []StackItem
	StackAfter   []StackItem
	Description  string
	GasCost      uint64
	WillComplete bool
}