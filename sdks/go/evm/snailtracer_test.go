package evm

import (
	"encoding/hex"
	"encoding/json"
	"math/big"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/evmts/guillotine/sdks/go/primitives"
)

func TestSnailtracer(t *testing.T) {
	// Read deployed bytecode (runtime code without constructor)
	deployedPath := filepath.Join("..", "..", "..", "src", "_test_utils", "fixtures", "snailtracer", "deployed_bytecode.txt")
	deployedBytes, err := os.ReadFile(deployedPath)
	if err != nil {
		// If deployed_bytecode.txt doesn't exist, fall back to extracting from bytecode.txt
		bytecodePath := filepath.Join("..", "..", "..", "src", "_test_utils", "fixtures", "snailtracer", "bytecode.txt")
		bytecodeHex, err := os.ReadFile(bytecodePath)
		if err != nil {
			t.Fatalf("Failed to read bytecode: %v", err)
		}
		
		// Clean and decode
		cleanHex := strings.ReplaceAll(string(bytecodeHex), "\n", "")
		cleanHex = strings.ReplaceAll(cleanHex, "\r", "")
		cleanHex = strings.ReplaceAll(cleanHex, " ", "")
		cleanHex = strings.ReplaceAll(cleanHex, "\t", "")
		
		bytecode, err := hex.DecodeString(cleanHex)
		if err != nil {
			t.Fatalf("Failed to decode bytecode: %v", err)
		}
		
		// Extract runtime code (skip first 32 bytes of constructor)
		if len(bytecode) <= 32 {
			t.Fatalf("Bytecode too short: %d bytes", len(bytecode))
		}
		deployedBytes = []byte(hex.EncodeToString(bytecode[32:]))
	} else {
		// Clean the deployed bytecode hex
		cleanHex := strings.ReplaceAll(string(deployedBytes), "\n", "")
		cleanHex = strings.ReplaceAll(cleanHex, "\r", "")
		cleanHex = strings.ReplaceAll(cleanHex, " ", "")
		cleanHex = strings.ReplaceAll(cleanHex, "\t", "")
		deployedBytes = []byte(cleanHex)
	}
	
	// Read calldata
	calldataPath := filepath.Join("..", "..", "..", "src", "_test_utils", "fixtures", "snailtracer", "calldata.txt")
	calldataHex, err := os.ReadFile(calldataPath)
	if err != nil {
		t.Fatalf("Failed to read calldata: %v", err)
	}
	
	// Clean and decode calldata
	cleanCalldata := strings.ReplaceAll(string(calldataHex), "\n", "")
	cleanCalldata = strings.ReplaceAll(cleanCalldata, "\r", "")
	cleanCalldata = strings.ReplaceAll(cleanCalldata, " ", "")
	cleanCalldata = strings.ReplaceAll(cleanCalldata, "\t", "")
	
	calldata, err := hex.DecodeString(cleanCalldata)
	if err != nil {
		t.Fatalf("Failed to decode calldata: %v", err)
	}
	
	// Decode deployed bytecode
	deployedCode, err := hex.DecodeString(string(deployedBytes))
	if err != nil {
		t.Fatalf("Failed to decode deployed bytecode: %v", err)
	}
	
	// Create EVM with tracing
	vm, err := NewTracing()
	if err != nil {
		t.Fatalf("Failed to create EVM: %v", err)
	}
	defer vm.Destroy()
	
	// Deploy contract
	contractAddress := primitives.NewAddress([20]byte{0x10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x01})
	if err := vm.SetCode(contractAddress, deployedCode); err != nil {
		t.Fatalf("Failed to set code: %v", err)
	}
	
	// Set up caller with balance
	callerAddress := primitives.NewAddress([20]byte{0xCA, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0xE5})
	if err := vm.SetBalance(callerAddress, big.NewInt(1000000000000000000)); err != nil { // 1 ETH
		t.Fatalf("Failed to set balance: %v", err)
	}
	
	// Execute call
	result, err := vm.Call(Call{
		Caller: callerAddress,
		To:     contractAddress,
		Value:  big.NewInt(0),
		Input:  calldata,
		Gas:    3000000000,
	})
	if err != nil {
		t.Fatalf("Call failed: %v", err)
	}
	
	if !result.Success {
		t.Errorf("Expected success=true, got false. Gas left: %d", result.GasLeft)
	}
	
	// Check trace
	if len(result.TraceJSON) == 0 {
		t.Error("Expected trace JSON, got empty")
	} else {
		// Parse the trace JSON to verify structure
		var trace map[string]interface{}
		if err := json.Unmarshal(result.TraceJSON, &trace); err != nil {
			t.Errorf("Failed to parse trace JSON: %v", err)
		} else if structLogs, ok := trace["structLogs"].([]interface{}); !ok {
			t.Error("structLogs not found in trace")
		} else {
			t.Logf("Snailtracer executed successfully with %d trace steps", len(structLogs))
		}
	}
}