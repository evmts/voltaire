package evm

import (
	"bytes"
	"encoding/hex"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/evmts/guillotine/bindings/go/primitives"
)

func TestErrorHandling(t *testing.T) {
	t.Run("Stack underflow", func(t *testing.T) {
		tests := []struct {
			name     string
			bytecode string
		}{
			{"POP on empty", "50"},
			{"ADD with one item", "600101"},
			{"DUP on empty", "80"},
			{"SWAP on single item", "600190"},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				evm := createTestEVM(t)
				defer evm.Destroy()

				bytecode, err := hex.DecodeString(tt.bytecode)
				require.NoError(t, err)

				result := evm.Execute(bytecode)
				assert.False(t, result.Success)
			})
		}
	})

	t.Run("Stack overflow", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := strings.Repeat("6001", 1025)
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.False(t, result.Success)
	})

	t.Run("Invalid jump destination", func(t *testing.T) {
		tests := []struct {
			name     string
			bytecode string
		}{
			{"Jump to data", "600456"},
			{"Jump out of bounds", "61ffff56"},
			{"Jump to PUSH data", "600a5660016002"},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				evm := createTestEVM(t)
				defer evm.Destroy()

				bytecode, err := hex.DecodeString(tt.bytecode)
				require.NoError(t, err)

				result := evm.Execute(bytecode)
				assert.False(t, result.Success)
			})
		}
	})

	t.Run("Invalid opcodes", func(t *testing.T) {
		invalidOpcodes := []string{"fe", "0c", "0d", "0e", "0f", "1e", "1f", "21", "22", "23", "24", "25", "26", "27", "28", "29", "2a", "2b", "2c", "2d", "2e", "2f", "49", "4a", "4b", "4c", "4d", "4e", "4f", "a5", "a6", "a7", "a8", "a9", "aa", "ab", "ac", "ad", "ae", "af", "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "ba", "bb", "bc", "bd", "be", "bf", "c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "ca", "cb", "cc", "cd", "ce", "cf", "d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "da", "db", "dc", "dd", "de", "df", "e0", "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "ea", "eb", "ec", "ed", "ee", "ef", "f6", "f7", "f8", "f9", "fb", "fc"}

		for _, opcode := range invalidOpcodes {
			t.Run("opcode_0x"+opcode, func(t *testing.T) {
				evm := createTestEVM(t)
				defer evm.Destroy()

				bytecode, err := hex.DecodeString(opcode)
				require.NoError(t, err)

				result := evm.Execute(bytecode)
				assert.False(t, result.Success)
			})
		}
	})

	t.Run("REVERT with data", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		revertData := "0123456789abcdef"
		bytecode := "7f" + revertData + "000000000000000000000000000000000000000000005f5260085ff3fd"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.False(t, result.Success)
		assert.Contains(t, result.Output, hexToBytes(revertData))
	})

	t.Run("Out of bounds memory access", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		gasLimit := NewU256FromUint64(30000)
		evm.SetGasLimit(&gasLimit)

		bytecode := "7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff5f52"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.False(t, result.Success)
	})

	t.Run("Division by zero", func(t *testing.T) {
		tests := []struct {
			opcode   string
			bytecode string
		}{
			{"DIV", "60015f04"},
			{"MOD", "60015f06"},
			{"ADDMOD", "600160015f08"},
			{"MULMOD", "600160015f09"},
		}

		for _, tt := range tests {
			t.Run(tt.opcode, func(t *testing.T) {
				evm := createTestEVM(t)
				defer evm.Destroy()

				bytecode, err := hex.DecodeString(tt.bytecode)
				require.NoError(t, err)

				result := evm.Execute(bytecode)
				assert.True(t, result.Success)
			})
		}
	})

	t.Run("Write in static context", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		callerAddr := NewAddress([20]byte{0x01})
		calleeAddr := NewAddress([20]byte{0x02})
		
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&callerAddr, &balance)
		
		writeCode := []byte{0x60, 0x01, 0x5f, 0x55}
		evm.SetCode(&calleeAddr, writeCode)

		staticCall := "5f5f5f5f73" + hex.EncodeToString(calleeAddr.Bytes()) + "61fffffa"
		bytecode, err := hex.DecodeString(staticCall)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &callerAddr)
		assert.False(t, result.Success)
	})

	t.Run("Insufficient balance for value transfer", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		poorAddr := NewAddress([20]byte{0x03})
		richAddr := NewAddress([20]byte{0x04})
		
		smallBalance := NewU256FromUint64(100)
		evm.SetBalance(&poorAddr, &smallBalance)

		transferTooMuch := "5f5f5f5f61271073" + hex.EncodeToString(richAddr.Bytes()) + "61fffff1"
		bytecode, err := hex.DecodeString(transferTooMuch)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &poorAddr)
		assert.False(t, result.Success)
	})

	t.Run("Call depth limit exceeded", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		recursiveAddr := NewAddress([20]byte{0x05})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&recursiveAddr, &balance)
		
		infiniteRecursion := "5f5f5f5f5f3061fffff1"
		bytecode, err := hex.DecodeString(infiniteRecursion)
		require.NoError(t, err)
		evm.SetCode(&recursiveAddr, bytecode)

		result := evm.ExecuteWithAddress(bytecode, &recursiveAddr)
		assert.NotNil(t, result)
	})

	t.Run("RETURNDATACOPY out of bounds", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := "60205f5f3e"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.False(t, result.Success)
	})

	t.Run("CALLDATACOPY out of bounds", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := "60205f5f37"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.True(t, result.Success)
	})

	t.Run("CODECOPY out of bounds", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := "61ffff5f5f39"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.True(t, result.Success)
	})

	t.Run("CREATE2 address collision", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x06})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		salt := "0000000000000000000000000000000000000000000000000000000000000001"
		initCode := "5f5260205ff3"
		
		create2Bytecode := "7f" + salt + "5f5f" + initCode + "5f525ff5"
		bytecode, err := hex.DecodeString(create2Bytecode)
		require.NoError(t, err)

		result1 := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result1)

		result2 := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result2)
	})

	t.Run("EXTCODECOPY with non-existent account", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		nonExistent := NewAddress([20]byte{0xff})
		bytecode := "60205f5f73" + hex.EncodeToString(nonExistent.Bytes()) + "3c"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.True(t, result.Success)
	})

	t.Run("BYTE index out of bounds", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := "600160201a"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.True(t, result.Success)
	})

	t.Run("SHL/SHR overflow", func(t *testing.T) {
		tests := []struct {
			name     string
			bytecode string
		}{
			{"SHL overflow", "6001610100021b"},
			{"SHR overflow", "7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff610100021c"},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				evm := createTestEVM(t)
				defer evm.Destroy()

				bytecode, err := hex.DecodeString(tt.bytecode)
				require.NoError(t, err)

				result := evm.Execute(bytecode)
				assert.True(t, result.Success)
			})
		}
	})

	t.Run("SIGNEXTEND edge cases", func(t *testing.T) {
		tests := []struct {
			name     string
			bytecode string
		}{
			{"Extend negative", "60ff60000b"},
			{"Extend positive", "607f60000b"},
			{"Invalid index", "60ff60200b"},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				evm := createTestEVM(t)
				defer evm.Destroy()

				bytecode, err := hex.DecodeString(tt.bytecode)
				require.NoError(t, err)

				result := evm.Execute(bytecode)
				assert.True(t, result.Success)
			})
		}
	})

	t.Run("Memory limit enforcement", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		gasLimit := NewU256FromUint64(3000000)
		evm.SetGasLimit(&gasLimit)

		largeMemory := "7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff52"
		bytecode, err := hex.DecodeString(largeMemory)
		require.NoError(t, err)

		result := evm.Execute(bytecode)
		assert.False(t, result.Success)
	})

	t.Run("Precompile failures", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		tests := []struct {
			name       string
			precompile string
			input      string
		}{
			{"Invalid ecrecover", "0000000000000000000000000000000000000001", "ff"},
			{"Invalid modexp", "0000000000000000000000000000000000000005", "ff"},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				precompileAddr := NewAddress([20]byte{})
				copy(precompileAddr.Bytes(), hexToBytes(tt.precompile))

				inputData := tt.input
				callPrecompile := "7f" + inputData + "0000000000000000000000000000000000000000000000000000005f5260015f73" + hex.EncodeToString(precompileAddr.Bytes()) + "5af1"
				
				bytecode, err := hex.DecodeString(callPrecompile)
				require.NoError(t, err)

				result := evm.Execute(bytecode)
				assert.NotNil(t, result)
			})
		}
	})
}

func TestRecoveryMechanisms(t *testing.T) {
	t.Run("Graceful error recovery", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		failingCall := "5f5f5f5f5f736000000000000000000000000000000000000000015af1156100235760016100275660006100275b5f5260205ff3"
		bytecode, err := hex.DecodeString(failingCall)
		require.NoError(t, err)

		result := evm.Execute(bytecode)
		assert.NotNil(t, result)
	})

	t.Run("Transaction atomicity", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		addr := NewAddress([20]byte{})
		initialValue := NewU256FromUint64(0xaa)
		key := NewU256FromUint64(0)
		evm.SetStorage(&addr, &key, &initialValue)

		failingTransaction := "60bb5f55fe"
		bytecode, err := hex.DecodeString(failingTransaction)
		require.NoError(t, err)

		result := evm.Execute(bytecode)
		assert.False(t, result.Success)
		
		currentValue := evm.GetStorage(&addr, &key)
		assert.Equal(t, initialValue.AsUint64(), currentValue.AsUint64())
	})
}

func TestEdgeCaseValues(t *testing.T) {
	t.Run("Maximum values", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		maxU256 := bytes.Repeat([]byte{0xff}, 32)
		maxValueOps := "7f" + hex.EncodeToString(maxU256) + "7f" + hex.EncodeToString(maxU256) + "01"
		
		bytecode, err := hex.DecodeString(maxValueOps)
		require.NoError(t, err)

		result := evm.Execute(bytecode)
		assert.True(t, result.Success)
	})

	t.Run("Minimum values", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		minValueOps := "5f5f03"
		bytecode, err := hex.DecodeString(minValueOps)
		require.NoError(t, err)

		result := evm.Execute(bytecode)
		assert.True(t, result.Success)
	})

	t.Run("Boundary values", func(t *testing.T) {
		tests := []struct {
			name     string
			bytecode string
		}{
			{"2^255 - 1", "7f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6001"},
			{"2^255", "7f8000000000000000000000000000000000000000000000000000000000000000"},
			{"Stack limit - 1", strings.Repeat("6001", 1023)},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				evm := createTestEVM(t)
				defer evm.Destroy()

				bytecode, err := hex.DecodeString(tt.bytecode)
				require.NoError(t, err)

				result := evm.Execute(bytecode)
				assert.True(t, result.Success)
			})
		}
	})
}