package evm

import (
	"bytes"
	"encoding/hex"
	"testing"

	"github.com/evmts/guillotine/sdks/go/primitives"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCallTypes(t *testing.T) {
	t.Run("CALL with value transfer", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		callerAddr := NewAddress([20]byte{0x01})
		calleeAddr := NewAddress([20]byte{0x02})
		
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&callerAddr, &balance)
		
		calleeCode := []byte{0x60, 0xaa, 0x5f, 0x52, 0x60, 0x20, 0x5f, 0xf3}
		evm.SetCode(&calleeAddr, calleeCode)

		callValue := "00000000000000000000000000000000000000000000000000000000000003e8"
		callBytecode := "5f5f5f5f7f" + callValue + "73" + hex.EncodeToString(calleeAddr.Bytes()) + "61ffff62f1"

		bytecode, err := hex.DecodeString(callBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &callerAddr)
		assert.NotNil(t, result, "CALL with value should complete")
		
		calleeBalance := evm.GetBalance(&calleeAddr)
		assert.NotEqual(t, uint64(0), calleeBalance.AsUint64(), "Callee should have received value")
	})

	t.Run("CALL without value transfer", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		callerAddr := NewAddress([20]byte{0x03})
		calleeAddr := NewAddress([20]byte{0x04})
		
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&callerAddr, &balance)
		
		calleeCode := []byte{0x60, 0xbb, 0x5f, 0x52, 0x60, 0x20, 0x5f, 0xf3}
		evm.SetCode(&calleeAddr, calleeCode)

		callBytecode := "5f5f5f5f5f73" + hex.EncodeToString(calleeAddr.Bytes()) + "61ffff62f1"

		bytecode, err := hex.DecodeString(callBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &callerAddr)
		assert.NotNil(t, result, "CALL without value should complete")
	})

	t.Run("DELEGATECALL context preservation", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		callerAddr := NewAddress([20]byte{0x05})
		delegateAddr := NewAddress([20]byte{0x06})
		
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&callerAddr, &balance)
		
		callerInitialStorage := NewU256FromUint64(0xaa)
		storageKey := NewU256FromUint64(0)
		evm.SetStorage(&callerAddr, &storageKey, &callerInitialStorage)
		
		delegateCode := []byte{0x60, 0xcc, 0x5f, 0x55}
		evm.SetCode(&delegateAddr, delegateCode)

		delegatecallBytecode := "5f5f5f5f73" + hex.EncodeToString(delegateAddr.Bytes()) + "61ffff62f4"

		bytecode, err := hex.DecodeString(delegatecallBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &callerAddr)
		assert.NotNil(t, result, "DELEGATECALL should complete")
		
		updatedStorage := evm.GetStorage(&callerAddr, &storageKey)
		assert.Equal(t, uint64(0xcc), updatedStorage.AsUint64(), "Storage should be updated in caller context")
		
		delegateStorage := evm.GetStorage(&delegateAddr, &storageKey)
		assert.Equal(t, uint64(0), delegateStorage.AsUint64(), "Delegate storage should remain unchanged")
	})

	t.Run("STATICCALL state modification restriction", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		callerAddr := NewAddress([20]byte{0x07})
		staticAddr := NewAddress([20]byte{0x08})
		
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&callerAddr, &balance)
		
		staticCodeWithWrite := []byte{0x60, 0xdd, 0x5f, 0x55}
		evm.SetCode(&staticAddr, staticCodeWithWrite)

		staticcallBytecode := "5f5f5f5f73" + hex.EncodeToString(staticAddr.Bytes()) + "61fffffa"

		bytecode, err := hex.DecodeString(staticcallBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &callerAddr)
		assert.False(t, result.Success, "STATICCALL with state modification should fail")
	})

	t.Run("Nested CALL operations", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		callerAddr := NewAddress([20]byte{0x0b})
		intermediateAddr := NewAddress([20]byte{0x0c})
		finalAddr := NewAddress([20]byte{0x0d})
		
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&callerAddr, &balance)
		
		finalCode := []byte{0x60, 0xff, 0x5f, 0x52, 0x60, 0x20, 0x5f, 0xf3}
		evm.SetCode(&finalAddr, finalCode)
		
		intermediateCode := "5f5f5f5f5f73" + hex.EncodeToString(finalAddr.Bytes()) + "61fffff15f5260205ff3"
		intermediateBytes, _ := hex.DecodeString(intermediateCode)
		evm.SetCode(&intermediateAddr, intermediateBytes)

		topLevelCall := "5f5f5f5f5f73" + hex.EncodeToString(intermediateAddr.Bytes()) + "61fffff1"
		bytecode, err := hex.DecodeString(topLevelCall)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &callerAddr)
		assert.NotNil(t, result, "Nested CALL operations should complete")
	})

	t.Run("CALL with return data", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		callerAddr := NewAddress([20]byte{0x10})
		calleeAddr := NewAddress([20]byte{0x11})
		
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&callerAddr, &balance)
		
		returnData := "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
		calleeCode := "7f" + returnData + "5f5260205ff3"
		calleeBytes, _ := hex.DecodeString(calleeCode)
		evm.SetCode(&calleeAddr, calleeBytes)

		callAndCaptureReturn := "60205f5f5f5f73" + hex.EncodeToString(calleeAddr.Bytes()) + 
			"61fffff1503d5f5f3e5f515f5260205ff3"

		bytecode, err := hex.DecodeString(callAndCaptureReturn)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &callerAddr)
		assert.NotNil(t, result, "CALL with return data capture should complete")
		assert.Equal(t, 32, len(result.Output), "Should return 32 bytes")
	})

	t.Run("Call depth limit", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		recursiveAddr := NewAddress([20]byte{0x14})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&recursiveAddr, &balance)
		
		recursiveCode := "5f5f5f5f5f3061fffff1"
		recursiveBytes, _ := hex.DecodeString(recursiveCode)
		evm.SetCode(&recursiveAddr, recursiveBytes)

		result := evm.ExecuteWithAddress(recursiveBytes, &recursiveAddr)
		assert.NotNil(t, result, "Deep recursion should be handled")
	})

	t.Run("CALL to non-existent account", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		callerAddr := NewAddress([20]byte{0x15})
		nonExistentAddr := NewAddress([20]byte{0x99})
		
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&callerAddr, &balance)

		callToNonExistent := "5f5f5f5f5f73" + hex.EncodeToString(nonExistentAddr.Bytes()) + "61fffff1"

		bytecode, err := hex.DecodeString(callToNonExistent)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &callerAddr)
		assert.NotNil(t, result, "CALL to non-existent account should complete")
	})

	t.Run("CALL with insufficient gas", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		callerAddr := NewAddress([20]byte{0x16})
		calleeAddr := NewAddress([20]byte{0x17})
		
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&callerAddr, &balance)
		
		expensiveCode := bytes.Repeat([]byte{0x60, 0x00, 0x60, 0x00, 0x02}, 1000)
		evm.SetCode(&calleeAddr, expensiveCode)

		callWithLowGas := "5f5f5f5f5f73" + hex.EncodeToString(calleeAddr.Bytes()) + "6064f1"

		bytecode, err := hex.DecodeString(callWithLowGas)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &callerAddr)
		assert.NotNil(t, result, "CALL with insufficient gas should be handled")
	})
}