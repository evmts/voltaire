package plan

import (
	"context"
	"errors"
	"fmt"
	"runtime"
	"sync"

	"github.com/evmts/guillotine/bindings/go/primitives"
)

// STUB IMPLEMENTATION NOTICE:
// This is a temporary stub implementation of the Plan package that allows
// testing of the Go interface design while the underlying C API build issues
// are resolved. This provides the same API surface but uses simplified 
// internal logic for bytecode analysis.

var (
	// ErrNilBytecode is returned when bytecode is nil
	ErrNilBytecode = errors.New("nil bytecode")
	// ErrEmptyBytecode is returned when bytecode is empty
	ErrEmptyBytecode = errors.New("empty bytecode")
	// ErrBytecodeTooLarge is returned when bytecode exceeds maximum size
	ErrBytecodeTooLarge = errors.New("bytecode too large")
	// ErrPlanClosed is returned when operation is attempted on closed plan
	ErrPlanClosed = errors.New("plan is closed")
	// ErrIndexOutOfBounds is returned when index is out of bounds
	ErrIndexOutOfBounds = errors.New("index out of bounds")
	// ErrInvalidPlan is returned when plan creation fails
	ErrInvalidPlan = errors.New("invalid plan")
)

const (
	// MaxBytecodeSize is the maximum allowed bytecode size (24576 bytes per EIP-170)
	MaxBytecodeSize = 24576
)

// Plan represents an analyzed execution plan for EVM bytecode
type Plan struct {
	bytecode     []byte // Original bytecode
	instructions []instruction
	constants    []primitives.U256
	jumpDests    []uint32
	mu           sync.RWMutex
	closed       bool
}

// instruction represents a parsed EVM instruction
type instruction struct {
	opcode byte
	data   []byte
}

// Stats contains statistics about a Plan
type Stats struct {
	// InstructionCount is the number of instructions in the plan
	InstructionCount uint32
	// ConstantCount is the number of constants (PUSH values) in the plan  
	ConstantCount uint32
	// BytecodeLength is the length of the original bytecode
	BytecodeLength uint32
	// HasPCMapping indicates if PC to instruction mapping is available
	HasPCMapping bool
	// MemoryUsage is the memory usage of the plan in bytes
	MemoryUsage uint64
}

// New creates a new execution plan from bytecode
func New(ctx context.Context, bytecode []byte) (*Plan, error) {
	// Check context first
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	// Validate input
	if bytecode == nil {
		return nil, ErrNilBytecode
	}
	if len(bytecode) == 0 {
		return nil, ErrEmptyBytecode
	}
	if len(bytecode) > MaxBytecodeSize {
		return nil, ErrBytecodeTooLarge
	}

	// Parse bytecode to extract instructions, constants, and jump destinations
	instructions, constants, jumpDests, err := parseBytecode(ctx, bytecode)
	if err != nil {
		return nil, fmt.Errorf("failed to parse bytecode: %w", err)
	}

	// Create Go wrapper
	plan := &Plan{
		bytecode:     make([]byte, len(bytecode)), // Copy to avoid external mutations
		instructions: instructions,
		constants:    constants,
		jumpDests:    jumpDests,
	}
	copy(plan.bytecode, bytecode)

	// Set finalizer for automatic cleanup
	runtime.SetFinalizer(plan, (*Plan).finalize)

	return plan, nil
}

// parseBytecode parses EVM bytecode into instructions, constants, and jump destinations
func parseBytecode(ctx context.Context, bytecode []byte) ([]instruction, []primitives.U256, []uint32, error) {
	var instructions []instruction
	var constants []primitives.U256
	var jumpDests []uint32

	i := 0
	for i < len(bytecode) {
		if err := ctx.Err(); err != nil {
			return nil, nil, nil, err
		}

		opcode := bytecode[i]
		inst := instruction{opcode: opcode}

		// Handle PUSH instructions (0x60-0x7F)
		if opcode >= 0x60 && opcode <= 0x7F {
			pushSize := int(opcode - 0x5F) // PUSH1=1, PUSH2=2, ..., PUSH32=32
			if i+pushSize >= len(bytecode) {
				// Not enough bytes for PUSH data, treat as malformed
				instructions = append(instructions, inst)
				i++
				continue
			}

			// Extract PUSH data
			pushData := bytecode[i+1 : i+1+pushSize]
			inst.data = make([]byte, len(pushData))
			copy(inst.data, pushData)

			// Create U256 constant (right-aligned, big-endian)
			constantBytes := make([]byte, 32)
			copy(constantBytes[32-pushSize:], pushData)
			constant, err := primitives.U256FromBytes(constantBytes)
			if err != nil {
				return nil, nil, nil, fmt.Errorf("invalid PUSH data at PC %d: %w", i, err)
			}
			constants = append(constants, constant)

			i += 1 + pushSize
		} else {
			// Handle JUMPDEST
			if opcode == 0x5B {
				jumpDests = append(jumpDests, uint32(i))
			}
			i++
		}

		instructions = append(instructions, inst)
	}

	return instructions, constants, jumpDests, nil
}

// Close releases the plan resources
func (p *Plan) Close() error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.closed {
		return nil // Already closed
	}

	p.closed = true
	runtime.SetFinalizer(p, nil)
	return nil
}

// finalize is called by garbage collector
func (p *Plan) finalize() {
	p.Close()
}

// Bytecode returns the original bytecode
func (p *Plan) Bytecode() []byte {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed {
		return nil
	}

	// Return a copy to prevent external mutation
	result := make([]byte, len(p.bytecode))
	copy(result, p.bytecode)
	return result
}

// BytecodeLength returns the length of the original bytecode
func (p *Plan) BytecodeLength() int {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed {
		return 0
	}

	return len(p.bytecode)
}

// InstructionCount returns the number of instructions in the plan
func (p *Plan) InstructionCount() uint32 {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed {
		return 0
	}

	return uint32(len(p.instructions))
}

// ConstantCount returns the number of constants (PUSH values) in the plan
func (p *Plan) ConstantCount() uint32 {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed {
		return 0
	}

	return uint32(len(p.constants))
}

// HasPCMapping returns true if PC to instruction mapping is available
func (p *Plan) HasPCMapping() bool {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed {
		return false
	}

	// Stub implementation: simplified plans don't have PC mapping
	return false
}

// IsValidJumpDest returns true if the given PC is a valid jump destination
func (p *Plan) IsValidJumpDest(pc uint32) bool {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed {
		return false
	}

	// Check if PC is in our jump destinations list
	for _, jumpPC := range p.jumpDests {
		if jumpPC == pc {
			return true
		}
	}
	return false
}

// GetJumpDestinations returns all valid jump destinations
func (p *Plan) GetJumpDestinations(ctx context.Context) ([]uint32, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed {
		return nil, ErrPlanClosed
	}

	// Return a copy to prevent external mutation
	result := make([]uint32, len(p.jumpDests))
	copy(result, p.jumpDests)
	return result, nil
}

// GetConstant retrieves a constant by index
func (p *Plan) GetConstant(ctx context.Context, index uint32) (primitives.U256, error) {
	if err := ctx.Err(); err != nil {
		return primitives.ZeroU256(), err
	}

	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed {
		return primitives.ZeroU256(), ErrPlanClosed
	}

	// Check bounds
	if index >= uint32(len(p.constants)) {
		return primitives.ZeroU256(), ErrIndexOutOfBounds
	}

	return p.constants[index], nil
}

// GetAllConstants retrieves all constants from the plan
func (p *Plan) GetAllConstants(ctx context.Context) ([]primitives.U256, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed {
		return nil, ErrPlanClosed
	}

	// Return a copy to prevent external mutation
	result := make([]primitives.U256, len(p.constants))
	copy(result, p.constants)
	return result, nil
}

// GetInstructionElement retrieves an instruction element by index
func (p *Plan) GetInstructionElement(ctx context.Context, index uint32) (uint64, error) {
	if err := ctx.Err(); err != nil {
		return 0, err
	}

	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed {
		return 0, ErrPlanClosed
	}

	// Check bounds
	if index >= uint32(len(p.instructions)) {
		return 0, ErrIndexOutOfBounds
	}

	// Return the opcode as the instruction element (simplified)
	return uint64(p.instructions[index].opcode), nil
}

// GetStats returns comprehensive statistics about the plan
func (p *Plan) GetStats(ctx context.Context) (*Stats, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed {
		return nil, ErrPlanClosed
	}

	// Calculate approximate memory usage
	memoryUsage := uint64(len(p.bytecode))
	memoryUsage += uint64(len(p.instructions) * 8)  // Rough estimate for instructions
	memoryUsage += uint64(len(p.constants) * 32)    // U256 is 32 bytes
	memoryUsage += uint64(len(p.jumpDests) * 4)     // uint32 is 4 bytes

	return &Stats{
		InstructionCount: uint32(len(p.instructions)),
		ConstantCount:    uint32(len(p.constants)),
		BytecodeLength:   uint32(len(p.bytecode)),
		HasPCMapping:     false, // Simplified implementation
		MemoryUsage:      memoryUsage,
	}, nil
}