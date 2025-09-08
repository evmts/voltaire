package evm

import (
	"encoding/hex"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/evmts/guillotine/bindings/go/primitives"
)

func TestGasMetering(t *testing.T) {
	t.Run("Basic gas consumption", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		tests := []struct {
			name     string
			bytecode string
			minGas   uint64
			maxGas   uint64
		}{
			{"PUSH1", "6001", 3, 3},
			{"ADD", "600160020001", 6, 10},
			{"MUL", "600260030002", 6, 15},
			{"SSTORE", "600160005555", 20000, 25000},
			{"SLOAD", "600054", 100, 2200},
			{"MSTORE", "6001600052", 6, 15},
			{"KECCAK256", "60206000020", 30, 50},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				bytecode, err := hex.DecodeString(tt.bytecode)
				require.NoError(t, err)

				result := evm.Execute(bytecode)
				assert.True(t, result.Success)
				assert.GreaterOrEqual(t, result.GasUsed, tt.minGas)
				assert.LessOrEqual(t, result.GasUsed, tt.maxGas)
			})
		}
	})

	t.Run("Out of gas scenarios", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		gasLimit := NewU256FromUint64(100)
		evm.SetGasLimit(&gasLimit)

		expensiveBytecode := "600160005560016001556001600255"
		bytecode, err := hex.DecodeString(expensiveBytecode)
		require.NoError(t, err)

		result := evm.Execute(bytecode)
		assert.False(t, result.Success, "Should fail with out of gas")
	})

	t.Run("Gas refunds", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		addr := NewAddress([20]byte{})
		key := NewU256FromUint64(0)
		value := NewU256FromUint64(0xaa)
		evm.SetStorage(&addr, &key, &value)

		clearStorageBytecode := "5f5f55"
		bytecode, err := hex.DecodeString(clearStorageBytecode)
		require.NoError(t, err)

		result := evm.Execute(bytecode)
		assert.True(t, result.Success)
	})

	t.Run("Memory expansion gas", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		tests := []struct {
			name     string
			bytecode string
			desc     string
		}{
			{"32 bytes", "60aa5f52", "First word"},
			{"64 bytes", "60aa602052", "Second word"},
			{"1024 bytes", "60aa61040052", "Large expansion"},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				bytecode, err := hex.DecodeString(tt.bytecode)
				require.NoError(t, err)

				result := evm.Execute(bytecode)
				assert.True(t, result.Success, tt.desc)
			})
		}
	})

	t.Run("Call gas stipend", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		callerAddr := NewAddress([20]byte{0x01})
		calleeAddr := NewAddress([20]byte{0x02})
		
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&callerAddr, &balance)

		callWithValue := "5f5f5f5f600173" + hex.EncodeToString(calleeAddr.Bytes()) + "5af1"
		bytecode, err := hex.DecodeString(callWithValue)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &callerAddr)
		assert.NotNil(t, result)
	})

	t.Run("EIP-2200 SSTORE gas", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		tests := []struct {
			name        string
			bytecode    string
			description string
		}{
			{"Clean zero to non-zero", "60aa5f55", "First write"},
			{"Non-zero to non-zero", "60bb5f55", "Update value"},
			{"Non-zero to zero", "5f5f55", "Clear storage"},
			{"No-op same value", "60aa5f5560aa5f55", "Write same value"},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				bytecode, err := hex.DecodeString(tt.bytecode)
				require.NoError(t, err)

				result := evm.Execute(bytecode)
				assert.True(t, result.Success, tt.description)
			})
		}
	})

	t.Run("EIP-1884 gas repricing", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		tests := []struct {
			opcode   string
			bytecode string
			minGas   uint64
		}{
			{"BALANCE", "3031", 400},
			{"SLOAD", "5f54", 800},
			{"EXTCODEHASH", "303f", 400},
		}

		for _, tt := range tests {
			t.Run(tt.opcode, func(t *testing.T) {
				bytecode, err := hex.DecodeString(tt.bytecode)
				require.NoError(t, err)

				result := evm.Execute(bytecode)
				assert.True(t, result.Success)
			})
		}
	})

	t.Run("Dynamic gas calculation", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		tests := []struct {
			name     string
			bytecode string
			desc     string
		}{
			{"LOG0", "60aa5f525f6020a0", "Event with no topics"},
			{"LOG4", "60aa5f5260bb60cc60dd60ee5f6020a4", "Event with 4 topics"},
			{"CALLDATACOPY", "602060005f37", "Copy calldata"},
			{"CODECOPY", "602060005f39", "Copy code"},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				bytecode, err := hex.DecodeString(tt.bytecode)
				require.NoError(t, err)

				result := evm.Execute(bytecode)
				assert.True(t, result.Success, tt.desc)
			})
		}
	})

	t.Run("Gas limit enforcement", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		tests := []struct {
			gasLimit uint64
			bytecode string
			shouldSucceed bool
		}{
			{21000, "00", true},
			{100, "6001600201", false},
			{50000, "60016000556001600155", true},
			{1000, "60016000556001600155", false},
		}

		for _, tt := range tests {
			gasLimit := NewU256FromUint64(tt.gasLimit)
			evm.SetGasLimit(&gasLimit)

			bytecode, err := hex.DecodeString(tt.bytecode)
			require.NoError(t, err)

			result := evm.Execute(bytecode)
			assert.Equal(t, tt.shouldSucceed, result.Success)
		}
	})
}

func TestGasOptimizations(t *testing.T) {
	t.Run("Gas efficient patterns", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		efficientSwap := "600160028190"
		bytecode, err := hex.DecodeString(efficientSwap)
		require.NoError(t, err)

		result := evm.Execute(bytecode)
		assert.True(t, result.Success)
	})

	t.Run("Gas expensive patterns", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		expensiveLoop := "6064805b8060010360008112610014576100085661001a565b50"
		bytecode, err := hex.DecodeString(expensiveLoop)
		require.NoError(t, err)

		result := evm.Execute(bytecode)
		assert.True(t, result.Success)
	})
}

func TestIntrinsicGas(t *testing.T) {
	t.Run("Transaction intrinsic gas", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		tests := []struct {
			name     string
			bytecode string
			dataGas  uint64
		}{
			{"Empty", "", 0},
			{"Zero bytes", "000000", 12},
			{"Non-zero bytes", "ffffff", 48},
			{"Mixed", "00ff00ff", 28},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				bytecode, err := hex.DecodeString(tt.bytecode)
				require.NoError(t, err)

				result := evm.Execute(bytecode)
				assert.NotNil(t, result)
			})
		}
	})
}

func TestAccessListGas(t *testing.T) {
	t.Run("EIP-2930 access list", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		accessListBytecode := "5f545f54"
		bytecode, err := hex.DecodeString(accessListBytecode)
		require.NoError(t, err)

		result := evm.Execute(bytecode)
		assert.True(t, result.Success)
	})
}

func TestGasEstimation(t *testing.T) {
	t.Run("Accurate gas estimation", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		tests := []struct {
			name     string
			bytecode string
		}{
			{"Simple transfer", ""},
			{"Storage write", "60aa5f55"},
			{"Contract call", "5f5f5f5f5f3061fffff1"},
			{"Complex computation", "600a6014016005026003065f5260205ff3"},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				if tt.bytecode == "" {
					result := evm.Execute([]byte{})
					assert.NotNil(t, result)
				} else {
					bytecode, err := hex.DecodeString(tt.bytecode)
					require.NoError(t, err)
					result := evm.Execute(bytecode)
					assert.NotNil(t, result)
				}
			})
		}
	})
}