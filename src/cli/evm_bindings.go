package main

/*
#cgo CFLAGS: -I../evm
#cgo LDFLAGS: -L../../zig-out/lib -levm_c -L../../.zig-cache/o/382fbb5a7f149ffbf95bc54ea713644b -lc-kzg-4844 -L../../.zig-cache/o/c0ced02090543ae74391ae22fa5dbbd9 -lbn254_wrapper -L../../.zig-cache/o/e5dbc664786d72c8389073c12701d51c -lblst

#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

// Forward declarations for the EVM C API
typedef void* evm_frame_t;

// Library management
const char* evm_version(void);
const char* evm_build_info(void);
int evm_init(void);
void evm_cleanup(void);

// Frame lifecycle  
evm_frame_t evm_frame_create(const uint8_t* bytecode, size_t bytecode_len, uint64_t initial_gas);
void evm_frame_destroy(evm_frame_t frame);
int evm_frame_reset(evm_frame_t frame, uint64_t new_gas);

// Execution
int evm_frame_execute(evm_frame_t frame);

// Stack operations
int evm_frame_push_u64(evm_frame_t frame, uint64_t value);
int evm_frame_push_u32(evm_frame_t frame, uint32_t value);
int evm_frame_push_bytes(evm_frame_t frame, const uint8_t* bytes, size_t len);
int evm_frame_pop_u64(evm_frame_t frame, uint64_t* value_out);
int evm_frame_pop_u32(evm_frame_t frame, uint32_t* value_out);
int evm_frame_pop_bytes(evm_frame_t frame, uint8_t* bytes_out);
int evm_frame_peek_u64(evm_frame_t frame, uint64_t* value_out);
uint32_t evm_frame_stack_size(evm_frame_t frame);
uint32_t evm_frame_stack_capacity(evm_frame_t frame);

// State inspection
uint64_t evm_frame_get_gas_remaining(evm_frame_t frame);
uint64_t evm_frame_get_gas_used(evm_frame_t frame);
uint32_t evm_frame_get_pc(evm_frame_t frame);
size_t evm_frame_get_bytecode_len(evm_frame_t frame);
uint8_t evm_frame_get_current_opcode(evm_frame_t frame);
bool evm_frame_is_stopped(evm_frame_t frame);

// Error handling
const char* evm_error_string(int error_code);
bool evm_error_is_stop(int error_code);

// Error codes
#define EVM_SUCCESS                 0
#define EVM_ERROR_STACK_OVERFLOW   -1
#define EVM_ERROR_STACK_UNDERFLOW  -2
#define EVM_ERROR_OUT_OF_GAS       -3
#define EVM_ERROR_INVALID_JUMP     -4
#define EVM_ERROR_INVALID_OPCODE   -5
#define EVM_ERROR_OUT_OF_BOUNDS    -6
#define EVM_ERROR_ALLOCATION       -7
#define EVM_ERROR_BYTECODE_TOO_LARGE -8
#define EVM_ERROR_STOP             -9
#define EVM_ERROR_NULL_POINTER     -10
*/
import "C"

import (
	"fmt"
	"math/big"
	"unsafe"
)

// EVMFrame wraps the C API frame for Go usage
type EVMFrame struct {
	handle     C.evm_frame_t
	bytecode   []byte
	maxGas     uint64
	stepCount  int
	history    []ExecutionStep
	breakpoints map[uint64]bool
}

// NewEVMFrame creates a new EVM frame with the given bytecode and gas
func NewEVMFrame(bytecode []byte, initialGas uint64) (*EVMFrame, error) {
	// Initialize the library
	if C.evm_init() != 0 {
		return nil, fmt.Errorf("failed to initialize EVM library")
	}

	// Create the frame
	var cBytecode *C.uint8_t
	if len(bytecode) > 0 {
		cBytecode = (*C.uint8_t)(unsafe.Pointer(&bytecode[0]))
	}

	handle := C.evm_frame_create(cBytecode, C.size_t(len(bytecode)), C.uint64_t(initialGas))
	if handle == nil {
		return nil, fmt.Errorf("failed to create EVM frame")
	}

	return &EVMFrame{
		handle:      handle,
		bytecode:    append([]byte(nil), bytecode...), // Copy bytecode
		maxGas:      initialGas,
		stepCount:   0,
		history:     []ExecutionStep{},
		breakpoints: make(map[uint64]bool),
	}, nil
}

// Destroy cleans up the frame resources
func (f *EVMFrame) Destroy() {
	if f.handle != nil {
		C.evm_frame_destroy(f.handle)
		f.handle = nil
	}
}

// GetState returns the current EVM state compatible with the existing UI
func (f *EVMFrame) GetState() *EVMState {
	if f.handle == nil {
		return &EVMState{Status: StatusError, Error: "Frame destroyed"}
	}

	// Get current state from C API
	pc := uint64(C.evm_frame_get_pc(f.handle))
	gasRemaining := uint64(C.evm_frame_get_gas_remaining(f.handle))
	_ = uint64(C.evm_frame_get_gas_used(f.handle))
	stackSize := uint32(C.evm_frame_stack_size(f.handle))
	isStopped := bool(C.evm_frame_is_stopped(f.handle))

	// Determine status
	var status ExecutionStatus
	if isStopped {
		status = StatusCompleted
	} else {
		status = StatusPaused
	}

	// Build stack by reading from C API
	stack := make([]StackItem, 0, stackSize)
	for i := uint32(0); i < stackSize; i++ {
		var value C.uint64_t
		if C.evm_frame_peek_u64(f.handle, &value) == C.EVM_SUCCESS {
			// Note: This is a simplified approach - peek only shows top value
			// For a full implementation, you'd need to extend the C API
			// to peek at arbitrary stack positions
			bigVal := big.NewInt(int64(value))
			stack = append(stack, StackItem{
				Value: bigVal,
				Index: int(i),
			})
			break // Only get top value for now
		}
	}

	// Disassemble instructions (simplified - reuse existing logic)
	instructions := f.disassembleBytecode()

	return &EVMState{
		PC:               pc,
		Gas:              gasRemaining,
		MaxGas:           f.maxGas,
		Status:           status,
		Stack:            stack,
		Memory:           make([]byte, 1024), // Placeholder
		Bytecode:         f.bytecode,
		Instructions:     instructions,
		BasicBlocks:      []BasicBlock{},     // Could be computed
		ExecutionHistory: f.history,
		WatchedAddresses: []WatchedAddress{}, // Not implemented yet
		Profile:          ExecutionProfile{}, // Could be computed
		Error:            "",
	}
}

// Step executes one instruction
func (f *EVMFrame) Step() error {
	if f.handle == nil {
		return fmt.Errorf("frame destroyed")
	}

	// Get current state before step
	pcBefore := uint64(C.evm_frame_get_pc(f.handle))
	gasBefore := uint64(C.evm_frame_get_gas_remaining(f.handle))
	
	// Get current opcode
	opcode := uint8(C.evm_frame_get_current_opcode(f.handle))
	
	// Get stack before (simplified)
	stackBefore := []StackItem{}
	stackSize := uint32(C.evm_frame_stack_size(f.handle))
	if stackSize > 0 {
		var value C.uint64_t
		if C.evm_frame_peek_u64(f.handle, &value) == C.EVM_SUCCESS {
			stackBefore = append(stackBefore, StackItem{
				Value: big.NewInt(int64(value)),
				Index: 0,
			})
		}
	}

	// For single step execution, we can manually execute opcodes
	// or modify the C API to support single stepping
	// For now, let's simulate single step by checking the opcode
	
	switch opcode {
	case 0x60: // PUSH1
		if pcBefore+1 < uint64(len(f.bytecode)) {
			value := uint64(f.bytecode[pcBefore+1])
			result := C.evm_frame_push_u64(f.handle, C.uint64_t(value))
			if result != C.EVM_SUCCESS {
				errorMsg := C.GoString(C.evm_error_string(result))
				return fmt.Errorf("PUSH1 failed: %s", errorMsg)
			}
			// Manually advance PC (this would normally be done by the interpreter)
			// Note: In a full implementation, you'd need single-step support in the C API
		}
	case 0x01: // ADD
		// Pop two values, add them, push result
		var a, b C.uint64_t
		if C.evm_frame_pop_u64(f.handle, &a) != C.EVM_SUCCESS {
			return fmt.Errorf("ADD: stack underflow")
		}
		if C.evm_frame_pop_u64(f.handle, &b) != C.EVM_SUCCESS {
			return fmt.Errorf("ADD: stack underflow")
		}
		result := uint64(a) + uint64(b)
		if C.evm_frame_push_u64(f.handle, C.uint64_t(result)) != C.EVM_SUCCESS {
			return fmt.Errorf("ADD: stack overflow")
		}
	case 0x00: // STOP
		// Execution completed
		return nil
	default:
		// For other opcodes, we'd need to implement them or use full execution
		return fmt.Errorf("opcode 0x%02x not implemented in step mode", opcode)
	}

	// Get state after step
	pcAfter := uint64(C.evm_frame_get_pc(f.handle))
	gasAfter := uint64(C.evm_frame_get_gas_remaining(f.handle))

	// Record execution step
	step := ExecutionStep{
		StepNumber:   f.stepCount,
		PC:           pcBefore,
		Opcode:       opcode,
		OpcodeName:   f.getOpcodeName(opcode),
		GasBefore:    gasBefore,
		GasAfter:     gasAfter,
		StackBefore:  stackBefore,
		StackAfter:   []StackItem{}, // Would need to get current stack
		MemoryChange: nil,
	}
	f.history = append(f.history, step)
	f.stepCount++

	// Update PC if it wasn't updated by the operation
	if pcAfter == pcBefore {
		// This is a simplification - normally the C API would handle PC updates
	}

	return nil
}

// Run executes until completion or breakpoint
func (f *EVMFrame) Run() error {
	if f.handle == nil {
		return fmt.Errorf("frame destroyed")
	}

	// For full execution, we can use the C API directly
	result := C.evm_frame_execute(f.handle)
	if result != C.EVM_SUCCESS && !C.evm_error_is_stop(result) {
		errorMsg := C.GoString(C.evm_error_string(result))
		return fmt.Errorf("execution failed: %s", errorMsg)
	}

	return nil
}

// Reset resets the frame to initial state
func (f *EVMFrame) Reset() error {
	if f.handle == nil {
		return fmt.Errorf("frame destroyed")
	}

	result := C.evm_frame_reset(f.handle, C.uint64_t(f.maxGas))
	if result != C.EVM_SUCCESS {
		errorMsg := C.GoString(C.evm_error_string(result))
		return fmt.Errorf("reset failed: %s", errorMsg)
	}

	f.stepCount = 0
	f.history = []ExecutionStep{}
	return nil
}

// Pause is a no-op since we control execution externally
func (f *EVMFrame) Pause() {
	// No-op - execution is controlled by Step() and Run() calls
}

// SetBreakpoint sets a breakpoint at the given PC
func (f *EVMFrame) SetBreakpoint(pc uint64) {
	f.breakpoints[pc] = true
}

// ClearBreakpoint clears a breakpoint at the given PC
func (f *EVMFrame) ClearBreakpoint(pc uint64) {
	delete(f.breakpoints, pc)
}

// IsBreakpoint checks if there's a breakpoint at the given PC
func (f *EVMFrame) IsBreakpoint(pc uint64) bool {
	return f.breakpoints[pc]
}

// GetNextOperation returns preview of what the next step will do
func (f *EVMFrame) GetNextOperation() *OperationPreview {
	if f.handle == nil {
		return nil
	}

	pc := uint64(C.evm_frame_get_pc(f.handle))
	opcode := uint8(C.evm_frame_get_current_opcode(f.handle))
	
	// Find instruction info
	instructions := f.disassembleBytecode()
	var currentInst *Instruction
	for _, inst := range instructions {
		if inst.PC == pc {
			currentInst = &inst
			break
		}
	}

	if currentInst == nil {
		return nil
	}

	// Get current stack
	stackBefore := []StackItem{}
	stackSize := uint32(C.evm_frame_stack_size(f.handle))
	if stackSize > 0 {
		var value C.uint64_t
		if C.evm_frame_peek_u64(f.handle, &value) == C.EVM_SUCCESS {
			stackBefore = append(stackBefore, StackItem{
				Value: big.NewInt(int64(value)),
				Index: 0,
			})
		}
	}

	// Simulate the operation (simplified)
	description := f.getOpcodeDescription(opcode, currentInst)
	
	return &OperationPreview{
		Instruction:  *currentInst,
		StackBefore:  stackBefore,
		StackAfter:   stackBefore, // Simplified
		Description:  description,
		GasCost:      currentInst.Gas,
		WillComplete: opcode == 0x00,
	}
}

// Helper methods

func (f *EVMFrame) getOpcodeName(opcode uint8) string {
	switch opcode {
	case 0x00:
		return "STOP"
	case 0x01:
		return "ADD"
	case 0x02:
		return "MUL"
	case 0x03:
		return "SUB"
	case 0x60:
		return "PUSH1"
	case 0x61:
		return "PUSH2"
	// Add more opcodes as needed
	default:
		return fmt.Sprintf("UNKNOWN_%02X", opcode)
	}
}

func (f *EVMFrame) getOpcodeDescription(opcode uint8, inst *Instruction) string {
	switch opcode {
	case 0x00:
		return "Halts execution successfully"
	case 0x01:
		return "Adds the top two stack values"
	case 0x02:
		return "Multiplies the top two stack values"
	case 0x03:
		return "Subtracts the top two stack values"
	case 0x60:
		if len(inst.Args) > 0 {
			return fmt.Sprintf("Pushes 0x%02X onto the stack", inst.Args[0])
		}
		return "Pushes 1-byte value onto stack"
	default:
		return inst.Description
	}
}

func (f *EVMFrame) disassembleBytecode() []Instruction {
	instructions := []Instruction{}
	pc := uint64(0)
	
	for pc < uint64(len(f.bytecode)) {
		opcode := f.bytecode[pc]
		name := f.getOpcodeName(opcode)
		
		var args []byte
		var gas uint64 = 3 // Default gas cost
		var stackPops, stackPushes int
		
		switch opcode {
		case 0x00: // STOP
			gas = 0
			stackPops = 0
			stackPushes = 0
		case 0x01, 0x02, 0x03: // ADD, MUL, SUB
			stackPops = 2
			stackPushes = 1
		case 0x60: // PUSH1
			if pc+1 < uint64(len(f.bytecode)) {
				args = []byte{f.bytecode[pc+1]}
				pc++ // Skip the argument byte
			}
			stackPops = 0
			stackPushes = 1
		}
		
		instruction := Instruction{
			PC:          pc,
			Opcode:      opcode,
			Name:        name,
			Args:        args,
			Gas:         gas,
			StackPops:   stackPops,
			StackPushes: stackPushes,
			Description: f.getOpcodeDescription(opcode, &Instruction{}),
			BasicBlock:  0, // Simplified
		}
		
		instructions = append(instructions, instruction)
		pc++
	}
	
	return instructions
}

// Additional methods for compatibility with the existing interface

func (f *EVMFrame) AddWatchedAddress(addr uint64, label string) {
	// Not implemented yet - would need memory inspection in C API
}

func (f *EVMFrame) RemoveWatchedAddress(addr uint64) {
	// Not implemented yet
}

func (f *EVMFrame) GetRecentMemoryChanges(count int) []MemoryChange {
	// Not implemented yet - would need memory tracking in C API
	return []MemoryChange{}
}

// GetVersion returns the EVM library version
func GetEVMVersion() string {
	return C.GoString(C.evm_version())
}

// GetBuildInfo returns the EVM build information
func GetEVMBuildInfo() string {
	return C.GoString(C.evm_build_info())
}

// Cleanup cleans up the EVM library
func CleanupEVM() {
	C.evm_cleanup()
}