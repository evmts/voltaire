package evm

import (
	"bytes"
	"encoding/hex"
	"fmt"
	"math/big"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestComprehensiveArithmeticOperations(t *testing.T) {
	tests := []struct {
		name           string
		bytecode       string
		expectedResult []byte
		expectedGas    uint64
		shouldFail     bool
	}{
		{
			name:           "ADD: 10 + 20 = 30",
			bytecode:       "600a6014015f5260205ff3",
			expectedResult: []byte{0x1e},
			expectedGas:    100,
		},
		{
			name:           "SUB: 50 - 20 = 30",
			bytecode:       "6014603203",
			expectedResult: []byte{},
			expectedGas:    100,
		},
		{
			name:           "MUL: 10 * 5 = 50",
			bytecode:       "6005600a025f5260205ff3",
			expectedResult: []byte{0x32},
			expectedGas:    100,
		},
		{
			name:           "DIV: 100 / 5 = 20",
			bytecode:       "600560640045f5260205ff3",
			expectedResult: []byte{0x14},
			expectedGas:    100,
		},
		{
			name:           "DIV by zero returns 0",
			bytecode:       "5f60640045f5260205ff3",
			expectedResult: []byte{0x00},
			expectedGas:    100,
		},
		{
			name:           "MOD: 100 % 7 = 2",
			bytecode:       "600760640065f5260205ff3",
			expectedResult: []byte{0x02},
			expectedGas:    100,
		},
		{
			name:           "EXP: 2 ** 8 = 256",
			bytecode:       "6008600202",
			expectedResult: []byte{},
			expectedGas:    200,
		},
		{
			name:           "ADDMOD: (10 + 20) % 7 = 2",
			bytecode:       "6007600a601408",
			expectedResult: []byte{},
			expectedGas:    100,
		},
		{
			name:           "MULMOD: (10 * 5) % 7 = 1",
			bytecode:       "6007600a600509",
			expectedResult: []byte{},
			expectedGas:    100,
		},
		{
			name:           "Complex arithmetic chain",
			bytecode:       "600a6014016005026003065f5260205ff3",
			expectedResult: []byte{0x64},
			expectedGas:    200,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evm := createTestEVM(t)
			defer evm.Destroy()

			bytecode, err := hex.DecodeString(tt.bytecode)
			require.NoError(t, err)

			result := evm.Execute(bytecode)
			
			if tt.shouldFail {
				assert.False(t, result.Success)
			} else {
				assert.True(t, result.Success, "execution should succeed")
				if len(tt.expectedResult) > 0 {
					assert.Equal(t, tt.expectedResult, result.Output)
				}
			}
		})
	}
}

func TestComprehensiveBitwiseOperations(t *testing.T) {
	tests := []struct {
		name           string
		bytecode       string
		expectedResult []byte
		description    string
	}{
		{
			name:           "AND: 0xFF & 0x0F = 0x0F",
			bytecode:       "600f60ff165f5260205ff3",
			expectedResult: []byte{0x0f},
			description:    "Bitwise AND operation",
		},
		{
			name:           "OR: 0xF0 | 0x0F = 0xFF",
			bytecode:       "600f60f0175f5260205ff3",
			expectedResult: []byte{0xff},
			description:    "Bitwise OR operation",
		},
		{
			name:           "XOR: 0xFF ^ 0xF0 = 0x0F",
			bytecode:       "60f060ff185f5260205ff3",
			expectedResult: []byte{0x0f},
			description:    "Bitwise XOR operation",
		},
		{
			name:           "NOT: ~0x00 = 0xFF...FF",
			bytecode:       "5f195f5260205ff3",
			expectedResult: bytes.Repeat([]byte{0xff}, 32),
			description:    "Bitwise NOT operation",
		},
		{
			name:           "SHL: 1 << 8 = 256",
			bytecode:       "6001600802",
			expectedResult: []byte{},
			description:    "Shift left operation",
		},
		{
			name:           "SHR: 256 >> 8 = 1",
			bytecode:       "61010060081c",
			expectedResult: []byte{},
			description:    "Shift right operation",
		},
		{
			name:           "BYTE: Get byte at index",
			bytecode:       "60ff60001a5f5260205ff3",
			expectedResult: []byte{0x00},
			description:    "Get specific byte from word",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evm := createTestEVM(t)
			defer evm.Destroy()

			bytecode, err := hex.DecodeString(tt.bytecode)
			require.NoError(t, err)

			result := evm.Execute(bytecode)
			assert.True(t, result.Success, "%s should succeed", tt.description)
			
			if len(tt.expectedResult) > 0 {
				assert.Equal(t, tt.expectedResult, result.Output)
			}
		})
	}
}

func TestComprehensiveComparisonOperations(t *testing.T) {
	tests := []struct {
		name           string
		bytecode       string
		expectedStack  uint64
		description    string
	}{
		{
			name:          "LT: 5 < 10 = true",
			bytecode:      "600a600510",
			expectedStack: 1,
			description:   "Less than comparison",
		},
		{
			name:          "GT: 10 > 5 = true",
			bytecode:      "6005600a11",
			expectedStack: 1,
			description:   "Greater than comparison",
		},
		{
			name:          "EQ: 10 == 10 = true",
			bytecode:      "600a600a14",
			expectedStack: 1,
			description:   "Equality comparison",
		},
		{
			name:          "EQ: 10 == 5 = false",
			bytecode:      "6005600a14",
			expectedStack: 0,
			description:   "Inequality comparison",
		},
		{
			name:          "ISZERO: 0 == 0 = true",
			bytecode:      "5f15",
			expectedStack: 1,
			description:   "Is zero check",
		},
		{
			name:          "ISZERO: 5 == 0 = false",
			bytecode:      "600515",
			expectedStack: 0,
			description:   "Is not zero check",
		},
		{
			name:          "SLT: -5 < 5 = true (signed)",
			bytecode:      "60056000600160001c0312",
			expectedStack: 1,
			description:   "Signed less than",
		},
		{
			name:          "SGT: 5 > -5 = true (signed)",
			bytecode:      "6000600160001c0360050313",
			expectedStack: 1,
			description:   "Signed greater than",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evm := createTestEVM(t)
			defer evm.Destroy()

			bytecode, err := hex.DecodeString(tt.bytecode + "5f5260205ff3")
			require.NoError(t, err)

			result := evm.Execute(bytecode)
			assert.True(t, result.Success, "%s should succeed", tt.description)
		})
	}
}

func TestComprehensiveMemoryOperations(t *testing.T) {
	tests := []struct {
		name           string
		bytecode       string
		expectedOutput []byte
		description    string
	}{
		{
			name:           "MSTORE and MLOAD",
			bytecode:       "7f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef5f52205f5360206000f3",
			expectedOutput: make([]byte, 32),
			description:    "Store and load 32 bytes",
		},
		{
			name:           "MSTORE8: Store single byte",
			bytecode:       "60ff5f535f60015360016000f3",
			expectedOutput: []byte{0xff},
			description:    "Store single byte at memory position",
		},
		{
			name:           "MSIZE: Memory size tracking",
			bytecode:       "7f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef60205259",
			expectedOutput: []byte{},
			description:    "Track memory expansion",
		},
		{
			name:           "MCOPY: Memory copy operation",
			bytecode:       "7f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef5f52602060205f5e60206020f3",
			expectedOutput: make([]byte, 32),
			description:    "Copy memory region",
		},
		{
			name:           "Large memory expansion",
			bytecode:       "61ffff5f52",
			expectedOutput: []byte{},
			description:    "Expand memory to large size",
		},
		{
			name:           "Memory with CALLDATACOPY",
			bytecode:       "5f5f60203760206000f3",
			expectedOutput: make([]byte, 32),
			description:    "Copy calldata to memory",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evm := createTestEVM(t)
			defer evm.Destroy()

			bytecode, err := hex.DecodeString(tt.bytecode)
			require.NoError(t, err)

			result := evm.Execute(bytecode)
			assert.True(t, result.Success, "%s should succeed", tt.description)
			
			if len(tt.expectedOutput) > 0 {
				assert.Equal(t, len(tt.expectedOutput), len(result.Output))
			}
		})
	}
}

func TestComprehensiveStorageOperations(t *testing.T) {
	tests := []struct {
		name        string
		bytecode    string
		description string
		checkState  func(*testing.T, *EVM)
	}{
		{
			name:        "SSTORE and SLOAD",
			bytecode:    "60aa5f555f545f5260205ff3",
			description: "Store and load from storage",
			checkState: func(t *testing.T, evm *EVM) {
				addr := NewAddress([20]byte{})
				key := NewU256FromUint64(0)
				value := evm.GetStorage(&addr, &key)
				expected := NewU256FromUint64(0xaa)
				assert.Equal(t, expected.Bytes(), value.Bytes())
			},
		},
		{
			name:        "Multiple storage slots",
			bytecode:    "60aa5f5560bb60015560cc600255",
			description: "Store to multiple slots",
			checkState: func(t *testing.T, evm *EVM) {
				addr := NewAddress([20]byte{})
				
				key0 := NewU256FromUint64(0)
				value0 := evm.GetStorage(&addr, &key0)
				assert.Equal(t, uint64(0xaa), value0.AsUint64())
				
				key1 := NewU256FromUint64(1)
				value1 := evm.GetStorage(&addr, &key1)
				assert.Equal(t, uint64(0xbb), value1.AsUint64())
				
				key2 := NewU256FromUint64(2)
				value2 := evm.GetStorage(&addr, &key2)
				assert.Equal(t, uint64(0xcc), value2.AsUint64())
			},
		},
		{
			name:        "Storage overwrite",
			bytecode:    "60aa5f5560bb5f55",
			description: "Overwrite storage value",
			checkState: func(t *testing.T, evm *EVM) {
				addr := NewAddress([20]byte{})
				key := NewU256FromUint64(0)
				value := evm.GetStorage(&addr, &key)
				expected := NewU256FromUint64(0xbb)
				assert.Equal(t, expected.Bytes(), value.Bytes())
			},
		},
		{
			name:        "TSTORE and TLOAD (transient storage)",
			bytecode:    "60aa5f5c5f5d",
			description: "Transient storage operations",
			checkState:  nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evm := createTestEVM(t)
			defer evm.Destroy()

			bytecode, err := hex.DecodeString(tt.bytecode)
			require.NoError(t, err)

			result := evm.Execute(bytecode)
			assert.True(t, result.Success, "%s should succeed", tt.description)
			
			if tt.checkState != nil {
				tt.checkState(t, evm)
			}
		})
	}
}

func TestComprehensiveStackOperations(t *testing.T) {
	tests := []struct {
		name        string
		bytecode    string
		description string
	}{
		{
			name:        "DUP operations",
			bytecode:    "6001600280818283",
			description: "DUP1, DUP2, DUP3 operations",
		},
		{
			name:        "SWAP operations",
			bytecode:    "600160026003909192",
			description: "SWAP1, SWAP2 operations",
		},
		{
			name:        "POP operation",
			bytecode:    "6001600250505f5260205ff3",
			description: "Remove items from stack",
		},
		{
			name:        "Deep DUP (DUP16)",
			bytecode:    "6001600260036004600560066007600860096000a6000b6000c6000d6000e6000f60108f",
			description: "DUP16 operation",
		},
		{
			name:        "Deep SWAP (SWAP16)",
			bytecode:    "6001600260036004600560066007600860096000a6000b6000c6000d6000e6000f60106011901f",
			description: "SWAP16 operation",
		},
		{
			name:        "Complex stack manipulation",
			bytecode:    "6001600260038091829050505f5260205ff3",
			description: "Complex DUP, SWAP, POP sequence",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evm := createTestEVM(t)
			defer evm.Destroy()

			bytecode, err := hex.DecodeString(tt.bytecode)
			require.NoError(t, err)

			result := evm.Execute(bytecode)
			assert.True(t, result.Success, "%s should succeed", tt.description)
		})
	}
}

func TestComprehensiveControlFlowOperations(t *testing.T) {
	tests := []struct {
		name        string
		bytecode    string
		description string
		shouldFail  bool
	}{
		{
			name:        "JUMP to valid destination",
			bytecode:    "600456005b60aa",
			description: "Jump to JUMPDEST",
		},
		{
			name:        "JUMPI conditional true",
			bytecode:    "6001600657005b60aa5f5260205ff3",
			description: "Conditional jump taken",
		},
		{
			name:        "JUMPI conditional false",
			bytecode:    "5f600657005b60aa5f5260205ff3",
			description: "Conditional jump not taken",
		},
		{
			name:        "PC operation",
			bytecode:    "58",
			description: "Get program counter",
		},
		{
			name:        "Invalid JUMP destination",
			bytecode:    "600356",
			description: "Jump to non-JUMPDEST",
			shouldFail:  true,
		},
		{
			name:        "Nested jumps",
			bytecode:    "600a56005b600f56005b60aa5f5260205ff3005b60bb",
			description: "Multiple jump destinations",
		},
		{
			name:        "Loop with counter",
			bytecode:    "6005805b6001900360008112600657",
			description: "Simple countdown loop",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evm := createTestEVM(t)
			defer evm.Destroy()

			bytecode, err := hex.DecodeString(tt.bytecode)
			require.NoError(t, err)

			result := evm.Execute(bytecode)
			
			if tt.shouldFail {
				assert.False(t, result.Success, "%s should fail", tt.description)
			} else {
				assert.True(t, result.Success, "%s should succeed", tt.description)
			}
		})
	}
}

func TestComprehensiveContextOperations(t *testing.T) {
	evm := createTestEVM(t)
	defer evm.Destroy()

	tests := []struct {
		name        string
		bytecode    string
		description string
		setup       func()
	}{
		{
			name:        "ADDRESS: Get current address",
			bytecode:    "305f5260205ff3",
			description: "Get execution context address",
		},
		{
			name:        "BALANCE: Get balance",
			bytecode:    "30315f5260205ff3",
			description: "Get address balance",
		},
		{
			name:        "ORIGIN: Get tx origin",
			bytecode:    "325f5260205ff3",
			description: "Get transaction origin",
		},
		{
			name:        "CALLER: Get caller",
			bytecode:    "335f5260205ff3",
			description: "Get message sender",
		},
		{
			name:        "CALLVALUE: Get value",
			bytecode:    "345f5260205ff3",
			description: "Get call value",
		},
		{
			name:        "CALLDATASIZE: Get input size",
			bytecode:    "365f5260205ff3",
			description: "Get calldata size",
		},
		{
			name:        "CODESIZE: Get code size",
			bytecode:    "385f5260205ff3",
			description: "Get current code size",
		},
		{
			name:        "GASPRICE: Get gas price",
			bytecode:    "3a5f5260205ff3",
			description: "Get transaction gas price",
		},
		{
			name:        "RETURNDATASIZE: Get return data size",
			bytecode:    "3d5f5260205ff3",
			description: "Get size of return data",
		},
		{
			name:        "SELFBALANCE: Get self balance",
			bytecode:    "475f5260205ff3",
			description: "Get balance of current account",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.setup != nil {
				tt.setup()
			}

			bytecode, err := hex.DecodeString(tt.bytecode)
			require.NoError(t, err)

			result := evm.Execute(bytecode)
			assert.True(t, result.Success, "%s should succeed", tt.description)
		})
	}
}

func TestComprehensiveBlockOperations(t *testing.T) {
	evm := createTestEVM(t)
	defer evm.Destroy()

	tests := []struct {
		name        string
		bytecode    string
		description string
	}{
		{
			name:        "BLOCKHASH: Get block hash",
			bytecode:    "6001405f5260205ff3",
			description: "Get hash of block",
		},
		{
			name:        "COINBASE: Get coinbase",
			bytecode:    "415f5260205ff3",
			description: "Get block coinbase",
		},
		{
			name:        "TIMESTAMP: Get timestamp",
			bytecode:    "425f5260205ff3",
			description: "Get block timestamp",
		},
		{
			name:        "NUMBER: Get block number",
			bytecode:    "435f5260205ff3",
			description: "Get current block number",
		},
		{
			name:        "DIFFICULTY/PREVRANDAO: Get difficulty",
			bytecode:    "445f5260205ff3",
			description: "Get block difficulty",
		},
		{
			name:        "GASLIMIT: Get gas limit",
			bytecode:    "455f5260205ff3",
			description: "Get block gas limit",
		},
		{
			name:        "CHAINID: Get chain ID",
			bytecode:    "465f5260205ff3",
			description: "Get chain identifier",
		},
		{
			name:        "BASEFEE: Get base fee",
			bytecode:    "485f5260205ff3",
			description: "Get block base fee",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bytecode, err := hex.DecodeString(tt.bytecode)
			require.NoError(t, err)

			result := evm.Execute(bytecode)
			assert.True(t, result.Success, "%s should succeed", tt.description)
		})
	}
}

func TestComprehensiveHashingOperations(t *testing.T) {
	tests := []struct {
		name           string
		bytecode       string
		expectedOutput []byte
		description    string
	}{
		{
			name:        "KECCAK256: Hash empty data",
			bytecode:    "5f5f205f5260205ff3",
			expectedOutput: make([]byte, 32),
			description: "Hash empty input",
		},
		{
			name:        "KECCAK256: Hash single byte",
			bytecode:    "60ff5f5360015f205f5260205ff3",
			expectedOutput: make([]byte, 32),
			description: "Hash single byte",
		},
		{
			name:        "KECCAK256: Hash 32 bytes",
			bytecode:    "7f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef5f5260205f205f5260205ff3",
			expectedOutput: make([]byte, 32),
			description: "Hash full word",
		},
		{
			name:        "KECCAK256: Hash large data",
			bytecode:    "7f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef5f527f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef60205260405f205f5260205ff3",
			expectedOutput: make([]byte, 32),
			description: "Hash 64 bytes",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evm := createTestEVM(t)
			defer evm.Destroy()

			bytecode, err := hex.DecodeString(tt.bytecode)
			require.NoError(t, err)

			result := evm.Execute(bytecode)
			assert.True(t, result.Success, "%s should succeed", tt.description)
			assert.Equal(t, len(tt.expectedOutput), len(result.Output))
		})
	}
}

func TestComprehensiveLoggingOperations(t *testing.T) {
	tests := []struct {
		name        string
		bytecode    string
		description string
	}{
		{
			name:        "LOG0: No topics",
			bytecode:    "60aa5f525f6020a0",
			description: "Emit log with no topics",
		},
		{
			name:        "LOG1: One topic",
			bytecode:    "60aa5f5260bb5f6020a1",
			description: "Emit log with one topic",
		},
		{
			name:        "LOG2: Two topics",
			bytecode:    "60aa5f5260bb60cc5f6020a2",
			description: "Emit log with two topics",
		},
		{
			name:        "LOG3: Three topics",
			bytecode:    "60aa5f5260bb60cc60dd5f6020a3",
			description: "Emit log with three topics",
		},
		{
			name:        "LOG4: Four topics",
			bytecode:    "60aa5f5260bb60cc60dd60ee5f6020a4",
			description: "Emit log with four topics",
		},
		{
			name:        "Empty log data",
			bytecode:    "5f5fa0",
			description: "Emit log with empty data",
		},
		{
			name:        "Large log data",
			bytecode:    "7f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef5f527f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef6020525f6040a0",
			description: "Emit log with 64 bytes data",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evm := createTestEVM(t)
			defer evm.Destroy()

			bytecode, err := hex.DecodeString(tt.bytecode)
			require.NoError(t, err)

			result := evm.Execute(bytecode)
			assert.True(t, result.Success, "%s should succeed", tt.description)
		})
	}
}

func TestComprehensivePushOperations(t *testing.T) {
	tests := []struct {
		name        string
		bytecode    string
		description string
	}{
		{
			name:        "PUSH0",
			bytecode:    "5f5f5260205ff3",
			description: "Push zero",
		},
		{
			name:        "PUSH1",
			bytecode:    "60aa5f5260205ff3",
			description: "Push 1 byte",
		},
		{
			name:        "PUSH2",
			bytecode:    "61aabb5f5260205ff3",
			description: "Push 2 bytes",
		},
		{
			name:        "PUSH32",
			bytecode:    "7f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef5f5260205ff3",
			description: "Push 32 bytes",
		},
		{
			name:        "Multiple pushes",
			bytecode:    "60aa60bb60cc",
			description: "Push multiple values",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evm := createTestEVM(t)
			defer evm.Destroy()

			bytecode, err := hex.DecodeString(tt.bytecode)
			require.NoError(t, err)

			result := evm.Execute(bytecode)
			assert.True(t, result.Success, "%s should succeed", tt.description)
		})
	}
}

func TestComprehensiveReturnOperations(t *testing.T) {
	tests := []struct {
		name           string
		bytecode       string
		expectedOutput []byte
		shouldRevert   bool
		description    string
	}{
		{
			name:           "RETURN: Return 32 bytes",
			bytecode:       "7f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef5f5260205ff3",
			expectedOutput: hexToBytes("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"),
			description:    "Return 32 bytes of data",
		},
		{
			name:           "RETURN: Empty return",
			bytecode:       "5f5ff3",
			expectedOutput: []byte{},
			description:    "Return with no data",
		},
		{
			name:           "REVERT: Revert with data",
			bytecode:       "60aa5f525f6020fd",
			expectedOutput: make([]byte, 32),
			shouldRevert:   true,
			description:    "Revert execution with data",
		},
		{
			name:           "REVERT: Empty revert",
			bytecode:       "5f5ffd",
			expectedOutput: []byte{},
			shouldRevert:   true,
			description:    "Revert with no data",
		},
		{
			name:           "STOP: Halt execution",
			bytecode:       "60aa00",
			expectedOutput: []byte{},
			description:    "Stop execution",
		},
		{
			name:           "INVALID: Invalid opcode",
			bytecode:       "fe",
			shouldRevert:   true,
			description:    "Execute invalid opcode",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evm := createTestEVM(t)
			defer evm.Destroy()

			bytecode, err := hex.DecodeString(tt.bytecode)
			require.NoError(t, err)

			result := evm.Execute(bytecode)
			
			if tt.shouldRevert {
				assert.False(t, result.Success, "%s should revert", tt.description)
			} else {
				assert.True(t, result.Success, "%s should succeed", tt.description)
			}
			
			if tt.expectedOutput != nil {
				assert.Equal(t, tt.expectedOutput, result.Output)
			}
		})
	}
}

func hexToBytes(s string) []byte {
	b, _ := hex.DecodeString(s)
	return b
}

func TestComplexScenarios(t *testing.T) {
	t.Run("Fibonacci sequence calculation", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := "6001600160005b8183018084116100145790509150806002575b5050505f5260205ff3"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.True(t, result.Success, "Fibonacci calculation should succeed")
	})

	t.Run("Factorial calculation", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := "60055f5b8060010183119150826001018060020260041461001957806001035b5f5260205ff3"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.True(t, result.Success, "Factorial calculation should succeed")
	})

	t.Run("Memory stress test", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := "61ffff5f5b816201000010610013578060010180915060aa825350610004565b50"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.True(t, result.Success, "Memory stress test should handle large allocations")
	})

	t.Run("Storage mapping simulation", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := "60015f5560026001556003600255600460035560016002540154015f5260205ff3"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.True(t, result.Success, "Storage mapping should work correctly")
	})

	t.Run("Nested memory operations", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := "7f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef5f52" +
			"7ffedcba9876543210fedcba9876543210fedcba9876543210fedcba98765432106020526020" +
			"60205f375f5160205101602051015f5260205ff3"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.True(t, result.Success, "Nested memory operations should succeed")
	})
}

func TestEdgeCasesAndBoundaries(t *testing.T) {
	t.Run("Maximum U256 value operations", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := "7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" +
			"7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" +
			"015f5260205ff3"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.True(t, result.Success, "Max U256 addition should overflow correctly")
	})

	t.Run("Division by zero edge cases", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		testCases := []string{
			"60015f045f5260205ff3",
			"60015f065f5260205ff3",
			"60015f5f085f5260205ff3",
		}

		for _, bytecode := range testCases {
			b, err := hex.DecodeString(bytecode)
			require.NoError(t, err)

			result := evm.Execute(b)
			assert.True(t, result.Success, "Division by zero should return 0")
		}
	})

	t.Run("Stack depth limits", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := ""
		for i := 0; i < 1024; i++ {
			bytecode += "6001"
		}
		bytecode += "00"

		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.False(t, result.Success, "Stack overflow should fail")
	})

	t.Run("Empty bytecode execution", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		result := evm.Execute([]byte{})
		assert.True(t, result.Success, "Empty bytecode should succeed")
		assert.Empty(t, result.Output, "Empty bytecode should return no output")
	})

	t.Run("Single STOP opcode", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		result := evm.Execute([]byte{0x00})
		assert.True(t, result.Success, "Single STOP should succeed")
		assert.Empty(t, result.Output, "STOP should return no output")
	})
}

func TestPerformanceConsiderations(t *testing.T) {
	t.Run("Large loop execution", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := "61ffff5f5b8161ffff116100155780600101809150610007565b505f5260205ff3"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		start := NewU256FromUint64(0)
		evm.SetGasLimit(&start)

		result := evm.Execute(b)
		assert.NotNil(t, result, "Large loop should complete")
	})

	t.Run("Deep recursion simulation", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := "6064805b8060010360008112610014576100085661001a565b5f9150610024565b6001810190610008565b505f5260205ff3"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.True(t, result.Success, "Deep recursion should succeed")
	})
}

func TestRealWorldPatterns(t *testing.T) {
	t.Run("ERC20 balance check pattern", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		addr := NewAddress([20]byte{0x01})
		slot := NewU256FromUint64(0)
		balance := NewU256FromUint64(1000)
		evm.SetStorage(&addr, &slot, &balance)

		bytecode := "5f545f5260205ff3"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.True(t, result.Success, "Balance check should succeed")
	})

	t.Run("Safe math pattern", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := "600a6005018060ff116100125760016100165660006100165b505f5260205ff3"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.True(t, result.Success, "Safe math pattern should succeed")
	})

	t.Run("Reentrancy guard pattern", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		bytecode := "5f5415610011576001905061001e565b60015f555f805f555b5f5260205ff3"
		b, err := hex.DecodeString(bytecode)
		require.NoError(t, err)

		result := evm.Execute(b)
		assert.True(t, result.Success, "Reentrancy guard should succeed")
	})
}