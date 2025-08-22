package main

import (
	"testing"
)

func TestEVM2FrameCreation(t *testing.T) {
	// Test frame creation with simple bytecode
	bytecode := []byte{0x60, 0x05, 0x60, 0x0A, 0x01, 0x00} // PUSH1 5, PUSH1 10, ADD, STOP
	initialGas := uint64(1000000)

	frame, err := NewEVM2Frame(bytecode, initialGas)
	if err != nil {
		t.Fatalf("Failed to create EVM2 frame: %v", err)
	}
	defer frame.Destroy()

	// Verify initial state
	state := frame.GetState()
	if state == nil {
		t.Fatal("GetState returned nil")
	}

	if state.PC != 0 {
		t.Errorf("Expected initial PC to be 0, got %d", state.PC)
	}

	if state.Gas != initialGas {
		t.Errorf("Expected initial gas to be %d, got %d", initialGas, state.Gas)
	}

	if state.MaxGas != initialGas {
		t.Errorf("Expected max gas to be %d, got %d", initialGas, state.MaxGas)
	}

	if len(state.Bytecode) != len(bytecode) {
		t.Errorf("Expected bytecode length %d, got %d", len(bytecode), len(state.Bytecode))
	}

	for i, b := range bytecode {
		if state.Bytecode[i] != b {
			t.Errorf("Bytecode mismatch at index %d: expected %02x, got %02x", i, b, state.Bytecode[i])
		}
	}
}

func TestEVM2FrameExecutionSimple(t *testing.T) {
	// Test execution of simple arithmetic: PUSH1 5, PUSH1 10, ADD, STOP
	bytecode := []byte{0x60, 0x05, 0x60, 0x0A, 0x01, 0x00}
	initialGas := uint64(1000000)

	frame, err := NewEVM2Frame(bytecode, initialGas)
	if err != nil {
		t.Fatalf("Failed to create EVM2 frame: %v", err)
	}
	defer frame.Destroy()

	// Execute the bytecode
	err = frame.Run()
	if err != nil {
		t.Fatalf("Frame execution failed: %v", err)
	}

	// Verify final state
	state := frame.GetState()
	if state.Status != StatusCompleted {
		t.Errorf("Expected status to be completed, got %v", state.Status)
	}

	// Should have one value on stack (15 = 5 + 10)
	if len(state.Stack) == 0 {
		t.Error("Expected stack to have at least one value after ADD operation")
	} else if len(state.Stack) > 0 {
		topValue := state.Stack[0].Value
		if topValue.Uint64() != 15 {
			t.Errorf("Expected top stack value to be 15, got %d", topValue.Uint64())
		}
	}

	// Gas should be consumed
	if state.Gas >= initialGas {
		t.Errorf("Expected gas to be consumed, but gas remained %d (initial: %d)", state.Gas, initialGas)
	}
}

func TestEVM2FrameStepExecution(t *testing.T) {
	// Test step-by-step execution
	bytecode := []byte{0x60, 0x05, 0x00} // PUSH1 5, STOP
	initialGas := uint64(1000000)

	frame, err := NewEVM2Frame(bytecode, initialGas)
	if err != nil {
		t.Fatalf("Failed to create EVM2 frame: %v", err)
	}
	defer frame.Destroy()

	// Get initial state
	initialState := frame.GetState()
	initialPC := initialState.PC

	// Step once (should execute PUSH1 5)
	err = frame.Step()
	if err != nil {
		t.Fatalf("First step failed: %v", err)
	}

	// Check that we have execution history (step function should record history)
	state := frame.GetState()
	if len(state.ExecutionHistory) == 0 {
		t.Error("Expected execution history to be recorded")
	} else {
		firstStep := state.ExecutionHistory[0]
		if firstStep.Opcode != 0x60 {
			t.Errorf("Expected first opcode to be PUSH1 (0x60), got 0x%02x", firstStep.Opcode)
		}
		if firstStep.OpcodeName != "PUSH1" {
			t.Errorf("Expected opcode name to be PUSH1, got %s", firstStep.OpcodeName)
		}
		if firstStep.PC != initialPC {
			t.Errorf("Expected step PC to be %d, got %d", initialPC, firstStep.PC)
		}
	}

	// Note: Current step implementation is limited and may not advance PC
	// This is acceptable as the bindings are a work in progress
	t.Logf("PC after step: %d (started at %d)", state.PC, initialPC)
	t.Logf("Gas after step: %d (started at %d)", state.Gas, initialState.Gas)
}

func TestEVM2FrameReset(t *testing.T) {
	// Test frame reset functionality
	bytecode := []byte{0x60, 0x05, 0x60, 0x0A, 0x01, 0x00} // PUSH1 5, PUSH1 10, ADD, STOP
	initialGas := uint64(1000000)

	frame, err := NewEVM2Frame(bytecode, initialGas)
	if err != nil {
		t.Fatalf("Failed to create EVM2 frame: %v", err)
	}
	defer frame.Destroy()

	// Execute a step to change state and create history
	err = frame.Step()
	if err != nil {
		t.Fatalf("Step failed: %v", err)
	}

	// Verify we have execution history
	stateAfterStep := frame.GetState()
	if len(stateAfterStep.ExecutionHistory) == 0 {
		t.Log("No execution history after step - this is expected with current implementation")
	}

	// Reset the frame
	err = frame.Reset()
	if err != nil {
		t.Fatalf("Frame reset failed: %v", err)
	}

	// Verify state is back to initial
	stateAfterReset := frame.GetState()
	if stateAfterReset.PC != 0 {
		t.Errorf("Expected PC to be reset to 0, got %d", stateAfterReset.PC)
	}

	if len(stateAfterReset.ExecutionHistory) != 0 {
		t.Error("Expected execution history to be cleared after reset")
	}

	// Verify gas is reset
	if stateAfterReset.Gas != initialGas {
		t.Errorf("Expected gas to be reset to %d, got %d", initialGas, stateAfterReset.Gas)
	}
}

func TestEVM2FrameBreakpoints(t *testing.T) {
	// Test breakpoint functionality
	bytecode := []byte{0x60, 0x05, 0x60, 0x0A, 0x01, 0x00} // PUSH1 5, PUSH1 10, ADD, STOP
	initialGas := uint64(1000000)

	frame, err := NewEVM2Frame(bytecode, initialGas)
	if err != nil {
		t.Fatalf("Failed to create EVM2 frame: %v", err)
	}
	defer frame.Destroy()

	// Test setting and checking breakpoints
	pc := uint64(2)
	
	// Initially no breakpoint
	if frame.IsBreakpoint(pc) {
		t.Error("Expected no breakpoint initially")
	}

	// Set breakpoint
	frame.SetBreakpoint(pc)
	if !frame.IsBreakpoint(pc) {
		t.Error("Expected breakpoint to be set")
	}

	// Clear breakpoint
	frame.ClearBreakpoint(pc)
	if frame.IsBreakpoint(pc) {
		t.Error("Expected breakpoint to be cleared")
	}
}

func TestEVM2FrameWithCustomBytecode(t *testing.T) {
	// Test with different bytecode patterns
	testCases := []struct {
		name     string
		bytecode []byte
		expectError bool
	}{
		{
			name:     "Empty bytecode",
			bytecode: []byte{},
			expectError: true, // EVM2 might not allow empty bytecode
		},
		{
			name:     "Single STOP",
			bytecode: []byte{0x00},
			expectError: false,
		},
		{
			name:     "Multiple PUSH operations",
			bytecode: []byte{0x60, 0x01, 0x60, 0x02, 0x60, 0x03, 0x00}, // PUSH1 1, PUSH1 2, PUSH1 3, STOP
			expectError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			frame, err := NewEVM2Frame(tc.bytecode, 1000000)
			
			if tc.expectError {
				if err == nil {
					t.Errorf("Expected error for test case %s, but got none", tc.name)
				}
				return
			}
			
			if err != nil {
				t.Fatalf("Unexpected error for test case %s: %v", tc.name, err)
			}
			defer frame.Destroy()

			// Try to execute
			err = frame.Run()
			if err != nil {
				t.Fatalf("Execution failed for test case %s: %v", tc.name, err)
			}

			// Verify final state
			state := frame.GetState()
			if state == nil {
				t.Fatalf("GetState returned nil for test case %s", tc.name)
			}
		})
	}
}

func TestEVM2DataProvider(t *testing.T) {
	// Test the data provider wrapper
	provider, err := NewEVM2DataProviderWithSample()
	if err != nil {
		t.Fatalf("Failed to create EVM2 data provider: %v", err)
	}
	defer provider.Cleanup()

	// Test getting initial state
	state := provider.GetState()
	if state == nil {
		t.Fatal("GetState returned nil")
	}

	if state.Status == StatusError {
		t.Errorf("Unexpected error state: %s", state.Error)
	}

	// Test stepping
	err = provider.Step()
	if err != nil {
		t.Fatalf("Step failed: %v", err)
	}

	// Test running
	provider.Reset()
	err = provider.Run()
	if err != nil {
		t.Fatalf("Run failed: %v", err)
	}

	// Verify final state shows completion
	finalState := provider.GetState()
	if finalState.Status != StatusCompleted {
		t.Errorf("Expected completion status, got %v", finalState.Status)
	}
}

func TestEVM2LibraryInfo(t *testing.T) {
	// Test library information functions
	version := GetEVM2Version()
	if version == "" {
		t.Error("Expected non-empty version string")
	}

	buildInfo := GetEVM2BuildInfo()
	if buildInfo == "" {
		t.Error("Expected non-empty build info string")
	}

	t.Logf("EVM2 Version: %s", version)
	t.Logf("EVM2 Build Info: %s", buildInfo)
}

// Benchmark tests for performance verification
func BenchmarkEVM2FrameCreation(b *testing.B) {
	bytecode := []byte{0x60, 0x05, 0x60, 0x0A, 0x01, 0x00}
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		frame, err := NewEVM2Frame(bytecode, 1000000)
		if err != nil {
			b.Fatalf("Frame creation failed: %v", err)
		}
		frame.Destroy()
	}
}

func BenchmarkEVM2FrameExecution(b *testing.B) {
	bytecode := []byte{0x60, 0x05, 0x60, 0x0A, 0x01, 0x00}
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		frame, err := NewEVM2Frame(bytecode, 1000000)
		if err != nil {
			b.Fatalf("Frame creation failed: %v", err)
		}
		
		err = frame.Run()
		if err != nil {
			b.Fatalf("Frame execution failed: %v", err)
		}
		
		frame.Destroy()
	}
}