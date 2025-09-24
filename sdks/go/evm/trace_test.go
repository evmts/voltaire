package evm_test

import (
	"encoding/json"
	"fmt"
	"math/big"
	"testing"

	"github.com/evmts/guillotine/sdks/go/evm"
	"github.com/evmts/guillotine/sdks/go/primitives"
)

func TestTracingCapture(t *testing.T) {
	// Create a tracing EVM instance
	vm, err := evm.NewTracing()
	if err != nil {
		t.Fatalf("Failed to create tracing EVM: %v", err)
	}
	defer vm.Destroy()

	// Simple bytecode: PUSH1 0x03, PUSH1 0x02, ADD, STOP
	bytecode := []byte{
		0x60, 0x03, // PUSH1 3
		0x60, 0x02, // PUSH1 2
		0x01,       // ADD
		0x00,       // STOP
	}

	// Set up addresses
	caller, _ := primitives.AddressFromBytes([]byte{0x10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0})
	to, _ := primitives.AddressFromBytes([]byte{0x20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0})

	// Fund caller
	if err := vm.SetBalance(caller, big.NewInt(1_000_000)); err != nil {
		t.Fatalf("Failed to set balance: %v", err)
	}

	// Set contract code
	if err := vm.SetCode(to, bytecode); err != nil {
		t.Fatalf("Failed to set code: %v", err)
	}

	// Execute CALL with tracing
	result, err := vm.Call(evm.Call{
		Caller: caller,
		To:     to,
		Value:  big.NewInt(0),
		Input:  []byte{},
		Gas:    100_000,
	})
	if err != nil {
		t.Fatalf("Call failed: %v", err)
	}

	// Check if trace JSON is present
	if len(result.TraceJSON) == 0 {
		t.Fatal("TraceJSON is empty - tracing is not working")
	}

	// Parse the trace JSON to verify structure
	var trace map[string]interface{}
	if err := json.Unmarshal(result.TraceJSON, &trace); err != nil {
		t.Fatalf("Failed to parse trace JSON: %v", err)
	}

	// Check for structLogs
	structLogs, ok := trace["structLogs"].([]interface{})
	if !ok {
		t.Fatal("structLogs not found in trace")
	}

	// We should have at least 4 steps (PUSH1, PUSH1, ADD, STOP)
	if len(structLogs) < 4 {
		t.Fatalf("Expected at least 4 steps in trace, got %d", len(structLogs))
	}

	fmt.Printf("Success! Captured %d trace steps\n", len(structLogs))
	
	// Print first few steps for debugging
	for i, step := range structLogs {
		if i >= 3 {
			break
		}
		stepMap := step.(map[string]interface{})
		fmt.Printf("Step %d: pc=%v op=%v gas=%v\n", 
			i, stepMap["pc"], stepMap["op"], stepMap["gas"])
	}
}

func TestTracingSnailtracer(t *testing.T) {
	// Create a tracing EVM instance
	vm, err := evm.NewTracing()
	if err != nil {
		t.Fatalf("Failed to create tracing EVM: %v", err)
	}
	defer vm.Destroy()

	// Snailtracer bytecode (from fixture)
	// This is a simplified version - you'll need to get the actual bytecode
	// For now, let's test with simple bytecode
	bytecode := []byte{
		0x60, 0x00, // PUSH1 0
		0x35,       // CALLDATALOAD
		0x60, 0x20, // PUSH1 32
		0x52,       // MSTORE
		0x60, 0x20, // PUSH1 32
		0x60, 0x00, // PUSH1 0
		0xF3,       // RETURN
	}

	// Set up addresses
	caller, _ := primitives.AddressFromBytes([]byte{0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00})
	to, _ := primitives.AddressFromBytes([]byte{0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01})

	// Fund caller
	if err := vm.SetBalance(caller, big.NewInt(1_000_000_000_000_000_000)); err != nil {
		t.Fatalf("Failed to set balance: %v", err)
	}

	// Set contract code
	if err := vm.SetCode(to, bytecode); err != nil {
		t.Fatalf("Failed to set code: %v", err)
	}

	// Execute CALL with tracing
	result, err := vm.Call(evm.Call{
		Caller: caller,
		To:     to,
		Value:  big.NewInt(0),
		Input:  []byte{0x12, 0x34, 0x56, 0x78}, // Some input data
		Gas:    10_000_000,
	})
	if err != nil {
		t.Fatalf("Call failed: %v", err)
	}

	// Check execution result
	if !result.Success {
		t.Fatalf("Call was not successful: %s", result.ErrorInfo)
	}

	// Check if trace JSON is present
	if len(result.TraceJSON) == 0 {
		t.Fatal("TraceJSON is empty - tracing is not working")
	}

	// Parse and print trace
	var trace map[string]interface{}
	if err := json.Unmarshal(result.TraceJSON, &trace); err != nil {
		t.Fatalf("Failed to parse trace JSON: %v", err)
	}

	structLogs, _ := trace["structLogs"].([]interface{})
	fmt.Printf("Captured %d trace steps for snailtracer-like code\n", len(structLogs))
	
	// Print trace JSON for debugging
	prettyJSON, _ := json.MarshalIndent(trace, "", "  ")
	t.Logf("Trace JSON:\n%s", string(prettyJSON))
}