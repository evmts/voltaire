package main

import (
	"encoding/hex"
	"fmt"
	"math/big"
)

// EVMState represents the current state of the EVM execution
type EVMState struct {
	PC             uint64
	Gas            uint64
	MaxGas         uint64
	Status         ExecutionStatus
	Stack          []StackItem
	Memory         []byte
	Bytecode       []byte
	Instructions   []Instruction
	BasicBlocks    []BasicBlock
	ExecutionHistory []ExecutionStep
	WatchedAddresses []WatchedAddress
	Profile        ExecutionProfile
	SourceMap      SourceMapping
	Error          string
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
	Address   uint64
	OldValue  byte
	NewValue  byte
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
	SourceFile    string
	SourceCode    string
	Mappings      map[uint64]SourceLocation // PC -> source location
	Functions     []FunctionInfo
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
	Name       string
	Selector   [4]byte
	StartPC    uint64
	EndPC      uint64
	SourceLoc  SourceLocation
	Visibility string // public, private, internal, external
	StateMutability string // pure, view, payable, nonpayable
}

// MockDataProvider simulates the C API interface
type MockDataProvider struct {
	state         *EVMState
	stepCount     int
	breakpoints   map[uint64]bool
	memoryChanges []MemoryChange
}

// NewMockDataProvider creates a new mock data provider with sample EVM execution
func NewMockDataProvider() *MockDataProvider {
	// Sample bytecode: PUSH1 0x20, PUSH1 0x40, ADD, PUSH1 0x10, SUB, STOP
	bytecode := []byte{0x60, 0x20, 0x60, 0x40, 0x01, 0x60, 0x10, 0x03, 0x00}
	
	instructions := []Instruction{
		{PC: 0, Opcode: 0x60, Name: "PUSH1", Args: []byte{0x20}, Gas: 3, StackPops: 0, StackPushes: 1, Description: "Push 1-byte value onto stack", BasicBlock: 0},
		{PC: 2, Opcode: 0x60, Name: "PUSH1", Args: []byte{0x40}, Gas: 3, StackPops: 0, StackPushes: 1, Description: "Push 1-byte value onto stack", BasicBlock: 0},
		{PC: 4, Opcode: 0x01, Name: "ADD", Args: nil, Gas: 3, StackPops: 2, StackPushes: 1, Description: "Addition operation", BasicBlock: 0},
		{PC: 5, Opcode: 0x60, Name: "PUSH1", Args: []byte{0x10}, Gas: 3, StackPops: 0, StackPushes: 1, Description: "Push 1-byte value onto stack", BasicBlock: 1},
		{PC: 7, Opcode: 0x03, Name: "SUB", Args: nil, Gas: 3, StackPops: 2, StackPushes: 1, Description: "Subtraction operation", BasicBlock: 1},
		{PC: 8, Opcode: 0x00, Name: "STOP", Args: nil, Gas: 0, StackPops: 0, StackPushes: 0, Description: "Halt execution", BasicBlock: 2},
	}

	// Create basic blocks
	basicBlocks := []BasicBlock{
		{ID: 0, StartPC: 0, EndPC: 4, TotalGas: 9, HitCount: 0},
		{ID: 1, StartPC: 5, EndPC: 7, TotalGas: 6, HitCount: 0},
		{ID: 2, StartPC: 8, EndPC: 8, TotalGas: 0, HitCount: 0},
	}

	// Initialize execution profile
	profile := ExecutionProfile{
		TotalSteps:        0,
		InstructionCounts: make(map[string]int),
		GasUsage:          make(map[string]uint64),
		BasicBlockHits:    make(map[int]int),
		HotspotPCs:        []uint64{},
		MaxStackSize:      0,
		TotalGasUsed:      0,
	}

	// Create source mapping with sample ERC20-like contract
	sourceMapping := createSampleSourceMapping()

	state := &EVMState{
		PC:               0,
		Gas:              1000000,
		MaxGas:           1000000,
		Status:           StatusPaused,
		Stack:            []StackItem{},
		Memory:           make([]byte, 1024),
		Bytecode:         bytecode,
		Instructions:     instructions,
		BasicBlocks:      basicBlocks,
		ExecutionHistory: []ExecutionStep{},
		WatchedAddresses: []WatchedAddress{
			{Address: 0x40, Label: "Storage Slot", Changes: []MemoryChange{}},
			{Address: 0x80, Label: "Temp Data", Changes: []MemoryChange{}},
		},
		Profile:          profile,
		SourceMap:        sourceMapping,
		Error:            "",
	}

	return &MockDataProvider{
		state:         state,
		stepCount:     0,
		breakpoints:   make(map[uint64]bool),
		memoryChanges: []MemoryChange{},
	}
}

// GetState returns the current EVM state
func (m *MockDataProvider) GetState() *EVMState {
	return m.state
}

// Step executes one instruction
func (m *MockDataProvider) Step() error {
	if m.state.Status == StatusCompleted || m.state.Status == StatusError {
		return fmt.Errorf("execution already finished")
	}

	// Find current instruction
	var currentInst *Instruction
	for _, inst := range m.state.Instructions {
		if inst.PC == m.state.PC {
			currentInst = &inst
			break
		}
	}

	if currentInst == nil {
		m.state.Status = StatusError
		m.state.Error = "Invalid instruction pointer"
		return fmt.Errorf("invalid instruction pointer")
	}

	// Record execution step (before)
	stackBefore := make([]StackItem, len(m.state.Stack))
	copy(stackBefore, m.state.Stack)
	gasBefore := m.state.Gas

	// Simulate instruction execution
	m.state.Gas -= currentInst.Gas
	if m.state.Gas <= 0 {
		m.state.Status = StatusError
		m.state.Error = "Out of gas"
		return fmt.Errorf("out of gas")
	}

	switch currentInst.Opcode {
	case 0x60: // PUSH1
		value := big.NewInt(int64(currentInst.Args[0]))
		m.state.Stack = append([]StackItem{{Value: value, Index: len(m.state.Stack)}}, m.state.Stack...)
		m.state.PC += 2
	case 0x01: // ADD
		if len(m.state.Stack) < 2 {
			m.state.Status = StatusError
			m.state.Error = "Stack underflow"
			return fmt.Errorf("stack underflow")
		}
		a := m.state.Stack[0].Value
		b := m.state.Stack[1].Value
		result := new(big.Int).Add(a, b)
		m.state.Stack = m.state.Stack[2:] // Remove two items
		m.state.Stack = append([]StackItem{{Value: result, Index: 0}}, m.state.Stack...)
		m.state.PC++
	case 0x03: // SUB
		if len(m.state.Stack) < 2 {
			m.state.Status = StatusError
			m.state.Error = "Stack underflow"
			return fmt.Errorf("stack underflow")
		}
		a := m.state.Stack[0].Value
		b := m.state.Stack[1].Value
		result := new(big.Int).Sub(a, b)
		m.state.Stack = m.state.Stack[2:] // Remove two items
		m.state.Stack = append([]StackItem{{Value: result, Index: 0}}, m.state.Stack...)
		m.state.PC++
	case 0x00: // STOP
		m.state.Status = StatusCompleted
		return nil
	default:
		m.state.PC++
	}

	// Update stack indices
	for i := range m.state.Stack {
		m.state.Stack[i].Index = i
	}

	// Record execution step (after)
	stackAfter := make([]StackItem, len(m.state.Stack))
	copy(stackAfter, m.state.Stack)
	
	var memoryChange *MemoryChange
	// Simulate some memory changes
	if m.stepCount%3 == 0 {
		addr := uint64(m.stepCount % 100)
		oldValue := m.state.Memory[addr]
		newValue := byte(m.stepCount % 256)
		m.state.Memory[addr] = newValue
		
		memoryChange = &MemoryChange{
			Address:    addr,
			OldValue:   oldValue,
			NewValue:   newValue,
			StepNumber: m.stepCount,
		}
		m.memoryChanges = append(m.memoryChanges, *memoryChange)
		
		// Update watched addresses
		for i := range m.state.WatchedAddresses {
			if m.state.WatchedAddresses[i].Address == addr {
				m.state.WatchedAddresses[i].Changes = append(m.state.WatchedAddresses[i].Changes, *memoryChange)
			}
		}
	}

	// Create execution step record
	step := ExecutionStep{
		StepNumber:   m.stepCount,
		PC:           currentInst.PC,
		Opcode:       currentInst.Opcode,
		OpcodeName:   currentInst.Name,
		GasBefore:    gasBefore,
		GasAfter:     m.state.Gas,
		StackBefore:  stackBefore,
		StackAfter:   stackAfter,
		MemoryChange: memoryChange,
	}
	m.state.ExecutionHistory = append(m.state.ExecutionHistory, step)

	// Update execution profile
	m.state.Profile.TotalSteps++
	m.state.Profile.InstructionCounts[currentInst.Name]++
	m.state.Profile.GasUsage[currentInst.Name] += currentInst.Gas
	m.state.Profile.BasicBlockHits[currentInst.BasicBlock]++
	m.state.Profile.TotalGasUsed += currentInst.Gas
	
	if len(m.state.Stack) > m.state.Profile.MaxStackSize {
		m.state.Profile.MaxStackSize = len(m.state.Stack)
	}
	
	// Update basic block hit counts
	for i := range m.state.BasicBlocks {
		if m.state.BasicBlocks[i].ID == currentInst.BasicBlock {
			m.state.BasicBlocks[i].HitCount++
			break
		}
	}

	m.stepCount++
	return nil
}

// Run executes until completion or error
func (m *MockDataProvider) Run() error {
	m.state.Status = StatusRunning
	for m.state.Status == StatusRunning {
		if m.breakpoints[m.state.PC] {
			m.state.Status = StatusPaused
			break
		}
		if err := m.Step(); err != nil {
			return err
		}
	}
	return nil
}

// Pause pauses execution
func (m *MockDataProvider) Pause() {
	if m.state.Status == StatusRunning {
		m.state.Status = StatusPaused
	}
}

// Reset resets the execution state
func (m *MockDataProvider) Reset() {
	m.state.PC = 0
	m.state.Gas = m.state.MaxGas
	m.state.Status = StatusPaused
	m.state.Stack = []StackItem{}
	m.state.Memory = make([]byte, 1024)
	m.state.Error = ""
	m.stepCount = 0
}

// SetBreakpoint sets a breakpoint at the given PC
func (m *MockDataProvider) SetBreakpoint(pc uint64) {
	m.breakpoints[pc] = true
}

// ClearBreakpoint clears a breakpoint at the given PC
func (m *MockDataProvider) ClearBreakpoint(pc uint64) {
	delete(m.breakpoints, pc)
}

// IsBreakpoint checks if there's a breakpoint at the given PC
func (m *MockDataProvider) IsBreakpoint(pc uint64) bool {
	return m.breakpoints[pc]
}

// GetNextOperation returns preview of what the next step will do
func (m *MockDataProvider) GetNextOperation() *OperationPreview {
	// Find current instruction
	var currentInst *Instruction
	for _, inst := range m.state.Instructions {
		if inst.PC == m.state.PC {
			currentInst = &inst
			break
		}
	}

	if currentInst == nil {
		return nil
	}

	// Simulate the operation
	stackBefore := make([]StackItem, len(m.state.Stack))
	copy(stackBefore, m.state.Stack)
	
	var stackAfter []StackItem
	var description string

	switch currentInst.Opcode {
	case 0x60: // PUSH1
		value := big.NewInt(int64(currentInst.Args[0]))
		stackAfter = append([]StackItem{{Value: value, Index: 0}}, stackBefore...)
		description = fmt.Sprintf("Pushes 0x%02X onto the stack", currentInst.Args[0])
	case 0x01: // ADD
		if len(stackBefore) >= 2 {
			a := stackBefore[0].Value
			b := stackBefore[1].Value
			result := new(big.Int).Add(a, b)
			stackAfter = append([]StackItem{{Value: result, Index: 0}}, stackBefore[2:]...)
			description = fmt.Sprintf("Adds %s + %s = %s", a.String(), b.String(), result.String())
		}
	case 0x03: // SUB
		if len(stackBefore) >= 2 {
			a := stackBefore[0].Value
			b := stackBefore[1].Value
			result := new(big.Int).Sub(a, b)
			stackAfter = append([]StackItem{{Value: result, Index: 0}}, stackBefore[2:]...)
			description = fmt.Sprintf("Subtracts %s - %s = %s", a.String(), b.String(), result.String())
		}
	case 0x00: // STOP
		stackAfter = stackBefore
		description = "Halts execution successfully"
	default:
		stackAfter = stackBefore
		description = currentInst.Description
	}

	// Update indices
	for i := range stackAfter {
		stackAfter[i].Index = i
	}

	return &OperationPreview{
		Instruction:  *currentInst,
		StackBefore:  stackBefore,
		StackAfter:   stackAfter,
		Description:  description,
		GasCost:      currentInst.Gas,
		WillComplete: currentInst.Opcode == 0x00,
	}
}

// AddWatchedAddress adds a new address to watch
func (m *MockDataProvider) AddWatchedAddress(addr uint64, label string) {
	// Check if already watching
	for _, watched := range m.state.WatchedAddresses {
		if watched.Address == addr {
			return
		}
	}
	
	m.state.WatchedAddresses = append(m.state.WatchedAddresses, WatchedAddress{
		Address: addr,
		Label:   label,
		Changes: []MemoryChange{},
	})
}

// RemoveWatchedAddress removes an address from watch list
func (m *MockDataProvider) RemoveWatchedAddress(addr uint64) {
	for i, watched := range m.state.WatchedAddresses {
		if watched.Address == addr {
			m.state.WatchedAddresses = append(m.state.WatchedAddresses[:i], m.state.WatchedAddresses[i+1:]...)
			break
		}
	}
}

// GetRecentMemoryChanges returns the most recent memory changes
func (m *MockDataProvider) GetRecentMemoryChanges(count int) []MemoryChange {
	if count > len(m.memoryChanges) {
		count = len(m.memoryChanges)
	}
	
	if count == 0 {
		return []MemoryChange{}
	}
	
	start := len(m.memoryChanges) - count
	return m.memoryChanges[start:]
}

// OperationPreview represents what will happen in the next step
type OperationPreview struct {
	Instruction  Instruction
	StackBefore  []StackItem
	StackAfter   []StackItem
	Description  string
	GasCost      uint64
	WillComplete bool
}

// createSampleSourceMapping creates a sample Solidity source mapping for demo purposes
func createSampleSourceMapping() SourceMapping {
	sourceCode := `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleCalculator {
    uint256 public result;
    
    function calculate(uint256 a, uint256 b) public returns (uint256) {
        uint256 sum = a + b;        // PC 0-4: PUSH1 0x20, PUSH1 0x40, ADD
        uint256 diff = sum - 0x10;  // PC 5-7: PUSH1 0x10, SUB  
        result = diff;
        return result;              // PC 8: STOP
    }
    
    function getResult() public view returns (uint256) {
        return result;
    }
}`

	functions := []FunctionInfo{
		{
			Name:       "calculate",
			Selector:   [4]byte{0x3f, 0x51, 0x1a, 0x1b}, // calculate(uint256,uint256)
			StartPC:    0,
			EndPC:      8,
			SourceLoc:  SourceLocation{Start: 95, Length: 200, Line: 6, Column: 4, SourceText: "function calculate(uint256 a, uint256 b) public returns (uint256)", Context: "calculate function"},
			Visibility: "public",
			StateMutability: "nonpayable",
		},
		{
			Name:       "getResult", 
			Selector:   [4]byte{0xde, 0x29, 0x2d, 0x2e}, // getResult()
			StartPC:    100,
			EndPC:      150,
			SourceLoc:  SourceLocation{Start: 350, Length: 80, Line: 12, Column: 4, SourceText: "function getResult() public view returns (uint256)", Context: "getResult function"},
			Visibility: "public",
			StateMutability: "view",
		},
	}

	mappings := make(map[uint64]SourceLocation)
	
	// Map bytecode instructions to source locations
	mappings[0] = SourceLocation{
		Start: 150, Length: 18, Line: 7, Column: 8,
		SourceText: "uint256 sum = a + b",
		Context: "calculate: loading first parameter (a)",
	}
	mappings[2] = SourceLocation{
		Start: 150, Length: 18, Line: 7, Column: 8,
		SourceText: "uint256 sum = a + b",
		Context: "calculate: loading second parameter (b)", 
	}
	mappings[4] = SourceLocation{
		Start: 155, Length: 6, Line: 7, Column: 18,
		SourceText: "a + b",
		Context: "calculate: performing addition",
	}
	mappings[5] = SourceLocation{
		Start: 190, Length: 20, Line: 8, Column: 8,
		SourceText: "uint256 diff = sum - 0x10",
		Context: "calculate: loading constant 0x10",
	}
	mappings[7] = SourceLocation{
		Start: 203, Length: 10, Line: 8, Column: 21,
		SourceText: "sum - 0x10",
		Context: "calculate: performing subtraction",
	}
	mappings[8] = SourceLocation{
		Start: 250, Length: 13, Line: 10, Column: 8,
		SourceText: "return result",
		Context: "calculate: halt execution",
	}

	return SourceMapping{
		SourceFile:      "SimpleCalculator.sol",
		SourceCode:      sourceCode,
		Mappings:        mappings,
		Functions:       functions,
		CurrentFunction: &functions[0], // Start in calculate function
	}
}