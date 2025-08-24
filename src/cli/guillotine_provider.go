//go:build !mock
// +build !mock

package main

import (
	"encoding/hex"
	"fmt"
	"math/big"
	"strings"

	"github.com/evmts/guillotine/bindings/go/evm"
	"github.com/evmts/guillotine/bindings/go/primitives"
	"github.com/evmts/guillotine/bindings/go/stack"
)

// GuillotineDataProvider implements the DataProvider interface using the guillotine-go package
type GuillotineDataProvider struct {
	vm           *evm.EVM
	stack        *stack.Stack
	bytecode     []byte
	pc           uint64
	gasRemaining uint64
	gasUsed      uint64
	maxGas       uint64
	status       ExecutionStatus
	memory       []byte
	error        string
	
	// Execution tracking
	stepCount    int
	history      []ExecutionStep
	breakpoints  map[uint64]bool
	watchedAddrs map[uint64]WatchedAddress
	memChanges   []MemoryChange
	
	// Cached state
	instructions []Instruction
	basicBlocks  []BasicBlock
}

// NewGuillotineDataProvider creates a new Guillotine-backed data provider
func NewGuillotineDataProvider(bytecodeHex string, initialGas uint64) (*GuillotineDataProvider, error) {
	// Remove 0x prefix if present
	bytecodeHex = strings.TrimPrefix(bytecodeHex, "0x")
	
	// Decode hex bytecode
	bytecode, err := hex.DecodeString(bytecodeHex)
	if err != nil {
		return nil, fmt.Errorf("failed to decode bytecode: %w", err)
	}
	
	// Create new EVM instance
	vm, err := evm.New()
	if err != nil {
		return nil, fmt.Errorf("failed to create EVM: %w", err)
	}
	
	// Create a new stack for tracking
	stackInstance, err := stack.New()
	if err != nil {
		return nil, fmt.Errorf("failed to create stack: %w", err)
	}
	
	provider := &GuillotineDataProvider{
		vm:           vm,
		stack:        stackInstance,
		bytecode:     bytecode,
		pc:           0,
		gasRemaining: initialGas,
		gasUsed:      0,
		maxGas:       initialGas,
		status:       StatusStopped,
		memory:       make([]byte, 0),
		stepCount:    0,
		history:      []ExecutionStep{},
		breakpoints:  make(map[uint64]bool),
		watchedAddrs: make(map[uint64]WatchedAddress),
		memChanges:   []MemoryChange{},
	}
	
	// Disassemble bytecode once
	provider.instructions = provider.disassembleBytecode()
	provider.basicBlocks = provider.analyzeBasicBlocks()
	
	return provider, nil
}

// NewGuillotineDataProviderWithSample creates a provider with sample bytecode
func NewGuillotineDataProviderWithSample() (*GuillotineDataProvider, error) {
	// Sample bytecode: PUSH1 0x02 PUSH1 0x03 ADD STOP
	sampleBytecode := "6002600301"
	return NewGuillotineDataProvider(sampleBytecode, 1000000)
}

// GetState returns the current EVM state
func (g *GuillotineDataProvider) GetState() *EVMState {
	// Build stack items from our tracked stack
	stackItems := make([]StackItem, 0)
	stackContents, err := g.stack.GetContents()
	if err == nil {
		for i, value := range stackContents {
			stackItems = append(stackItems, StackItem{
				Value: new(big.Int).SetBytes(value.Bytes()),
				Index: i,
			})
		}
	}
	
	return &EVMState{
		PC:               g.pc,
		Gas:              g.gasRemaining,
		MaxGas:           g.maxGas,
		Status:           g.status,
		Stack:            stackItems,
		Memory:           g.memory,
		Bytecode:         g.bytecode,
		Instructions:     g.instructions,
		BasicBlocks:      g.basicBlocks,
		ExecutionHistory: g.history,
		WatchedAddresses: g.getWatchedAddresses(),
		Profile:          g.calculateProfile(),
		Error:            g.error,
	}
}

// Step executes one instruction
func (g *GuillotineDataProvider) Step() error {
	if g.status == StatusCompleted || g.status == StatusError {
		return fmt.Errorf("execution already finished")
	}
	
	if g.pc >= uint64(len(g.bytecode)) {
		g.status = StatusCompleted
		return nil
	}
	
	// Get current opcode
	opcode := g.bytecode[g.pc]
	
	// Record state before execution
	stackBefore := g.copyStack()
	gasBefore := g.gasRemaining
	
	// Execute single opcode (simplified simulation)
	var err error
	switch opcode {
	case 0x00: // STOP
		g.status = StatusCompleted
		g.pc++
		
	case 0x01: // ADD
		if g.stack.Size() < 2 {
			err = fmt.Errorf("stack underflow")
		} else {
			a, _ := g.stack.PopU256()
			b, _ := g.stack.PopU256()
			result := new(big.Int).Add(new(big.Int).SetBytes(a.Bytes()), new(big.Int).SetBytes(b.Bytes()))
			resultU256, _ := primitives.U256FromBigInt(result)
			g.stack.PushU256(resultU256)
		}
		g.pc++
		g.gasRemaining -= 3
		
	case 0x60: // PUSH1
		if g.pc+1 < uint64(len(g.bytecode)) {
			value := g.bytecode[g.pc+1]
			g.stack.PushU64(uint64(value))
			g.pc += 2
		} else {
			err = fmt.Errorf("invalid PUSH1")
		}
		g.gasRemaining -= 3
		
	default:
		err = fmt.Errorf("opcode 0x%02x not implemented", opcode)
	}
	
	if err != nil {
		g.status = StatusError
		g.error = err.Error()
		return err
	}
	
	// Record execution step
	g.history = append(g.history, ExecutionStep{
		StepNumber:   g.stepCount,
		PC:           g.pc - 1, // PC before increment
		Opcode:       opcode,
		OpcodeName:   g.getOpcodeName(opcode),
		GasBefore:    gasBefore,
		GasAfter:     g.gasRemaining,
		StackBefore:  stackBefore,
		StackAfter:   g.copyStack(),
		MemoryChange: nil, // Memory tracking not implemented yet
	})
	
	g.stepCount++
	g.gasUsed = g.maxGas - g.gasRemaining
	
	// Check for breakpoints
	if g.breakpoints[g.pc] {
		g.status = StatusPaused
	}
	
	return nil
}

// Run executes until completion or breakpoint
func (g *GuillotineDataProvider) Run() error {
	g.status = StatusRunning
	
	for g.status == StatusRunning && g.pc < uint64(len(g.bytecode)) {
		if g.breakpoints[g.pc] {
			g.status = StatusPaused
			return nil
		}
		
		if err := g.Step(); err != nil {
			return err
		}
		
		if g.status == StatusCompleted || g.status == StatusError {
			break
		}
	}
	
	return nil
}

// Pause pauses execution
func (g *GuillotineDataProvider) Pause() {
	if g.status == StatusRunning {
		g.status = StatusPaused
	}
}

// Reset resets the execution state
func (g *GuillotineDataProvider) Reset() {
	g.pc = 0
	g.gasRemaining = g.maxGas
	g.gasUsed = 0
	g.status = StatusStopped
	g.error = ""
	g.stepCount = 0
	g.history = []ExecutionStep{}
	g.memChanges = []MemoryChange{}
	
	// Clear stack
	if g.stack != nil {
		g.stack.Reset()
	}
	
	// Clear memory
	g.memory = make([]byte, 0)
}

// Breakpoint management
func (g *GuillotineDataProvider) SetBreakpoint(pc uint64) {
	g.breakpoints[pc] = true
}

func (g *GuillotineDataProvider) ClearBreakpoint(pc uint64) {
	delete(g.breakpoints, pc)
}

func (g *GuillotineDataProvider) IsBreakpoint(pc uint64) bool {
	return g.breakpoints[pc]
}

// GetNextOperation returns a preview of the next operation
func (g *GuillotineDataProvider) GetNextOperation() *OperationPreview {
	if g.pc >= uint64(len(g.bytecode)) {
		return nil
	}
	
	opcode := g.bytecode[g.pc]
	
	// Find the instruction
	var inst *Instruction
	for _, instruction := range g.instructions {
		if instruction.PC == g.pc {
			inst = &instruction
			break
		}
	}
	
	if inst == nil {
		return nil
	}
	
	return &OperationPreview{
		Instruction:  *inst,
		StackBefore:  g.copyStack(),
		StackAfter:   g.simulateStackChange(opcode),
		Description:  g.getOpcodeDescription(opcode),
		GasCost:      g.getGasCost(opcode),
		WillComplete: opcode == 0x00, // STOP
	}
}

// Memory watching
func (g *GuillotineDataProvider) AddWatchedAddress(addr uint64, label string) {
	g.watchedAddrs[addr] = WatchedAddress{
		Address: addr,
		Label:   label,
		Changes: []MemoryChange{},
	}
}

func (g *GuillotineDataProvider) RemoveWatchedAddress(addr uint64) {
	delete(g.watchedAddrs, addr)
}

func (g *GuillotineDataProvider) GetRecentMemoryChanges(count int) []MemoryChange {
	start := len(g.memChanges) - count
	if start < 0 {
		start = 0
	}
	return g.memChanges[start:]
}

// Cleanup cleans up resources
func (g *GuillotineDataProvider) Cleanup() {
	if g.vm != nil {
		g.vm.Close()
	}
	if g.stack != nil {
		g.stack.Close()
	}
}

// Helper methods

func (g *GuillotineDataProvider) copyStack() []StackItem {
	items := make([]StackItem, 0)
	stackContents, err := g.stack.GetContents()
	if err == nil {
		for i, value := range stackContents {
			items = append(items, StackItem{
				Value: new(big.Int).SetBytes(value.Bytes()),
				Index: i,
			})
		}
	}
	return items
}

func (g *GuillotineDataProvider) simulateStackChange(opcode uint8) []StackItem {
	// Simplified simulation - in reality would need full opcode implementation
	return g.copyStack()
}

func (g *GuillotineDataProvider) getMemoryAt(addr uint64) []byte {
	if addr < uint64(len(g.memory)) {
		end := addr + 32
		if end > uint64(len(g.memory)) {
			end = uint64(len(g.memory))
		}
		return g.memory[addr:end]
	}
	return make([]byte, 32)
}

func (g *GuillotineDataProvider) getWatchedAddresses() []WatchedAddress {
	addrs := make([]WatchedAddress, 0, len(g.watchedAddrs))
	for _, addr := range g.watchedAddrs {
		addrs = append(addrs, addr)
	}
	return addrs
}

func (g *GuillotineDataProvider) calculateProfile() ExecutionProfile {
	profile := ExecutionProfile{
		TotalGasUsed:      g.gasUsed,
		TotalSteps:        g.stepCount,
		InstructionCounts: make(map[string]int),
		GasUsage:          make(map[string]uint64),
		BasicBlockHits:    make(map[int]int),
		HotspotPCs:        []uint64{},
		MaxStackSize:      int(g.stack.Size()),
	}
	
	// Calculate instruction statistics
	for _, step := range g.history {
		profile.InstructionCounts[step.OpcodeName]++
		profile.GasUsage[step.OpcodeName] += step.GasBefore - step.GasAfter
	}
	
	return profile
}

func (g *GuillotineDataProvider) getOpcodeName(opcode uint8) string {
	opcodeNames := map[uint8]string{
		0x00: "STOP",
		0x01: "ADD",
		0x02: "MUL",
		0x03: "SUB",
		0x04: "DIV",
		0x60: "PUSH1",
		0x61: "PUSH2",
		// Add more as needed
	}
	
	if name, ok := opcodeNames[opcode]; ok {
		return name
	}
	return fmt.Sprintf("UNKNOWN_%02X", opcode)
}

func (g *GuillotineDataProvider) getOpcodeDescription(opcode uint8) string {
	descriptions := map[uint8]string{
		0x00: "Halts execution",
		0x01: "Addition operation",
		0x60: "Push 1-byte value onto stack",
		// Add more as needed
	}
	
	if desc, ok := descriptions[opcode]; ok {
		return desc
	}
	return "Unknown opcode"
}

func (g *GuillotineDataProvider) getGasCost(opcode uint8) uint64 {
	// Simplified gas costs
	gasCosts := map[uint8]uint64{
		0x00: 0,  // STOP
		0x01: 3,  // ADD
		0x60: 3,  // PUSH1
		// Add more as needed
	}
	
	if cost, ok := gasCosts[opcode]; ok {
		return cost
	}
	return 3 // Default
}

func (g *GuillotineDataProvider) disassembleBytecode() []Instruction {
	instructions := []Instruction{}
	pc := uint64(0)
	
	for pc < uint64(len(g.bytecode)) {
		opcode := g.bytecode[pc]
		name := g.getOpcodeName(opcode)
		
		var args []byte
		var stackPops, stackPushes int
		
		switch opcode {
		case 0x00: // STOP
			stackPops = 0
			stackPushes = 0
		case 0x01: // ADD
			stackPops = 2
			stackPushes = 1
		case 0x60: // PUSH1
			if pc+1 < uint64(len(g.bytecode)) {
				args = []byte{g.bytecode[pc+1]}
				pc++ // Skip the argument
			}
			stackPops = 0
			stackPushes = 1
		}
		
		instruction := Instruction{
			PC:          pc,
			Opcode:      opcode,
			Name:        name,
			Args:        args,
			Gas:         g.getGasCost(opcode),
			StackPops:   stackPops,
			StackPushes: stackPushes,
			Description: g.getOpcodeDescription(opcode),
			BasicBlock:  0, // Will be set by analyzeBasicBlocks
		}
		
		instructions = append(instructions, instruction)
		pc++
	}
	
	return instructions
}

func (g *GuillotineDataProvider) analyzeBasicBlocks() []BasicBlock {
	// Simple basic block analysis
	blocks := []BasicBlock{}
	
	if len(g.instructions) == 0 {
		return blocks
	}
	
	// For now, treat the entire program as one basic block
	block := BasicBlock{
		ID:           0,
		StartPC:      0,
		EndPC:        g.instructions[len(g.instructions)-1].PC,
		Instructions: g.instructions,
		TotalGas:     0,
	}
	
	blocks = append(blocks, block)
	
	// Update instructions with block IDs
	for i := range g.instructions {
		g.instructions[i].BasicBlock = 0
	}
	
	return blocks
}