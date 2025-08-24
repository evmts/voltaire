package plan

/*
#cgo CFLAGS: -I../../../zig-out/include
#cgo LDFLAGS: -L../../../zig-out/lib -levm_c

#include <stdlib.h>
#include <stdint.h>

// Plan C API declarations
typedef struct GuillotinePlan GuillotinePlan;

typedef struct {
    uint32_t instruction_count;
    uint32_t constant_count;
    uint32_t bytecode_length;
    int has_pc_mapping;
    uint64_t memory_usage_bytes;
} GuillotinePlanStats;

// Plan lifecycle
GuillotinePlan* evm_plan_create(const uint8_t* bytecode, size_t bytecode_len);
void evm_plan_destroy(GuillotinePlan* plan);

// Plan properties
size_t evm_plan_get_bytecode_len(const GuillotinePlan* plan);
size_t evm_plan_get_bytecode(const GuillotinePlan* plan, uint8_t* buffer, size_t buffer_len);
uint32_t evm_plan_get_instruction_count(const GuillotinePlan* plan);
uint32_t evm_plan_get_constant_count(const GuillotinePlan* plan);
int evm_plan_has_pc_mapping(const GuillotinePlan* plan);

// Jump destinations
int evm_plan_is_valid_jump_dest(const GuillotinePlan* plan, uint32_t pc);
int evm_plan_pc_to_instruction(const GuillotinePlan* plan, uint32_t pc, uint32_t* instruction_idx);

// Constants access
int evm_plan_get_constant(const GuillotinePlan* plan, uint32_t index, uint8_t* buffer);
int evm_plan_get_instruction_element(const GuillotinePlan* plan, uint32_t index, uint64_t* element);

// Statistics
int evm_plan_get_stats(const GuillotinePlan* plan, GuillotinePlanStats* stats);

// Error handling
const char* evm_plan_error_string(int error_code);
int evm_plan_test_basic(void);

// Error codes
#define EVM_PLAN_SUCCESS 0
#define EVM_PLAN_ERROR_NULL_POINTER -1
#define EVM_PLAN_ERROR_INVALID_JUMP -2
*/
import "C"

import (
	"context"
	"errors"
	"fmt"
	"runtime"
	"sync"

	"github.com/evmts/guillotine/bindings/go/primitives"
)

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
	handle   *C.GuillotinePlan
	bytecode []byte // Keep original bytecode for reference
	mu       sync.RWMutex
	closed   bool
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

	// Create the plan using C API
	handle := C.evm_plan_create((*C.uint8_t)(&bytecode[0]), C.size_t(len(bytecode)))
	if handle == nil {
		return nil, ErrInvalidPlan
	}

	// Create Go wrapper
	plan := &Plan{
		handle:   handle,
		bytecode: make([]byte, len(bytecode)), // Copy to avoid external mutations
	}
	copy(plan.bytecode, bytecode)

	// Set finalizer for automatic cleanup
	runtime.SetFinalizer(plan, (*Plan).finalize)

	return plan, nil
}

// Close releases the plan resources
func (p *Plan) Close() error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.closed {
		return nil // Already closed
	}

	if p.handle != nil {
		C.evm_plan_destroy(p.handle)
		p.handle = nil
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

	if p.closed || p.handle == nil {
		return 0
	}

	return uint32(C.evm_plan_get_instruction_count(p.handle))
}

// ConstantCount returns the number of constants (PUSH values) in the plan
func (p *Plan) ConstantCount() uint32 {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed || p.handle == nil {
		return 0
	}

	return uint32(C.evm_plan_get_constant_count(p.handle))
}

// HasPCMapping returns true if PC to instruction mapping is available
func (p *Plan) HasPCMapping() bool {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed || p.handle == nil {
		return false
	}

	return C.evm_plan_has_pc_mapping(p.handle) != 0
}

// IsValidJumpDest returns true if the given PC is a valid jump destination
func (p *Plan) IsValidJumpDest(pc uint32) bool {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed || p.handle == nil {
		return false
	}

	return C.evm_plan_is_valid_jump_dest(p.handle, C.uint32_t(pc)) != 0
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

	// Scan through bytecode to find all JUMPDEST opcodes (0x5B)
	var jumpDests []uint32
	for i, b := range p.bytecode {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		
		if b == 0x5B { // JUMPDEST opcode
			jumpDests = append(jumpDests, uint32(i))
		}
	}

	return jumpDests, nil
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

	if p.handle == nil {
		return primitives.ZeroU256(), ErrPlanClosed
	}

	// Check bounds
	if index >= p.ConstantCount() {
		return primitives.ZeroU256(), ErrIndexOutOfBounds
	}

	// Get constant from C API
	var buffer [32]C.uint8_t
	result := C.evm_plan_get_constant(p.handle, C.uint32_t(index), &buffer[0])
	if result != C.EVM_PLAN_SUCCESS {
		return primitives.ZeroU256(), fmt.Errorf("failed to get constant: %s", 
			C.GoString(C.evm_plan_error_string(result)))
	}

	// Convert to Go bytes (big-endian for U256)
	bytes := make([]byte, 32)
	for i := 0; i < 32; i++ {
		bytes[i] = byte(buffer[i])
	}

	u256, err := primitives.U256FromBytes(bytes)
	if err != nil {
		return primitives.ZeroU256(), fmt.Errorf("failed to parse U256: %w", err)
	}

	return u256, nil
}

// GetAllConstants retrieves all constants from the plan
func (p *Plan) GetAllConstants(ctx context.Context) ([]primitives.U256, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	count := p.ConstantCount()
	if count == 0 {
		return []primitives.U256{}, nil
	}

	constants := make([]primitives.U256, count)
	for i := uint32(0); i < count; i++ {
		if err := ctx.Err(); err != nil {
			return nil, err
		}

		constant, err := p.GetConstant(ctx, i)
		if err != nil {
			return nil, fmt.Errorf("failed to get constant %d: %w", i, err)
		}
		constants[i] = constant
	}

	return constants, nil
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

	if p.handle == nil {
		return 0, ErrPlanClosed
	}

	// Check bounds
	if index >= p.InstructionCount() {
		return 0, ErrIndexOutOfBounds
	}

	var element C.uint64_t
	result := C.evm_plan_get_instruction_element(p.handle, C.uint32_t(index), &element)
	if result != C.EVM_PLAN_SUCCESS {
		return 0, fmt.Errorf("failed to get instruction element: %s",
			C.GoString(C.evm_plan_error_string(result)))
	}

	return uint64(element), nil
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

	if p.handle == nil {
		return nil, ErrPlanClosed
	}

	var cStats C.GuillotinePlanStats
	result := C.evm_plan_get_stats(p.handle, &cStats)
	if result != C.EVM_PLAN_SUCCESS {
		return nil, fmt.Errorf("failed to get stats: %s",
			C.GoString(C.evm_plan_error_string(result)))
	}

	return &Stats{
		InstructionCount: uint32(cStats.instruction_count),
		ConstantCount:    uint32(cStats.constant_count),
		BytecodeLength:   uint32(cStats.bytecode_length),
		HasPCMapping:     cStats.has_pc_mapping != 0,
		MemoryUsage:      uint64(cStats.memory_usage_bytes),
	}, nil
}