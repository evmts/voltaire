package primitives

import "testing"

func TestIntrinsicGas(t *testing.T) {
	tests := []struct {
		name                      string
		data                      []byte
		isContractCreation        bool
		accessListAddressCount    uint64
		accessListStorageKeyCount uint64
		expected                  uint64
	}{
		{
			name:                      "empty transaction",
			data:                      []byte{},
			isContractCreation:        false,
			accessListAddressCount:    0,
			accessListStorageKeyCount: 0,
			expected:                  21000,
		},
		{
			name:                      "contract creation empty",
			data:                      []byte{},
			isContractCreation:        true,
			accessListAddressCount:    0,
			accessListStorageKeyCount: 0,
			expected:                  53000,
		},
		{
			name:                      "transaction with zero bytes",
			data:                      []byte{0, 0, 0, 0},
			isContractCreation:        false,
			accessListAddressCount:    0,
			accessListStorageKeyCount: 0,
			expected:                  21000 + 4*4, // 21016
		},
		{
			name:                      "transaction with non-zero bytes",
			data:                      []byte{1, 2, 3, 4},
			isContractCreation:        false,
			accessListAddressCount:    0,
			accessListStorageKeyCount: 0,
			expected:                  21000 + 4*16, // 21064
		},
		{
			name:                      "mixed zero and non-zero bytes",
			data:                      []byte{0, 1, 0, 2},
			isContractCreation:        false,
			accessListAddressCount:    0,
			accessListStorageKeyCount: 0,
			expected:                  21000 + 2*4 + 2*16, // 21040
		},
		{
			name:                      "with access list",
			data:                      []byte{},
			isContractCreation:        false,
			accessListAddressCount:    2,
			accessListStorageKeyCount: 3,
			expected:                  21000 + 2*2400 + 3*1900, // 30500
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IntrinsicGas(tt.data, tt.isContractCreation, tt.accessListAddressCount, tt.accessListStorageKeyCount)
			if result != tt.expected {
				t.Errorf("IntrinsicGas() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestCalldataGasCost(t *testing.T) {
	tests := []struct {
		name     string
		data     []byte
		expected uint64
	}{
		{
			name:     "empty data",
			data:     []byte{},
			expected: 0,
		},
		{
			name:     "all zero bytes",
			data:     []byte{0, 0, 0, 0, 0},
			expected: 5 * 4, // 20
		},
		{
			name:     "all non-zero bytes",
			data:     []byte{1, 2, 3, 4, 5},
			expected: 5 * 16, // 80
		},
		{
			name:     "mixed bytes",
			data:     []byte{0, 1, 0, 2, 0, 3},
			expected: 3*4 + 3*16, // 60
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CalldataGasCost(tt.data)
			if result != tt.expected {
				t.Errorf("CalldataGasCost() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestMemoryGasCost(t *testing.T) {
	tests := []struct {
		name        string
		currentSize uint64
		newSize     uint64
		expected    uint64
	}{
		{
			name:        "no expansion",
			currentSize: 100,
			newSize:     100,
			expected:    0,
		},
		{
			name:        "shrink (no cost)",
			currentSize: 200,
			newSize:     100,
			expected:    0,
		},
		{
			name:        "zero to 32 bytes (1 word)",
			currentSize: 0,
			newSize:     32,
			expected:    3, // 3 * 1 + 1^2 / 512 = 3
		},
		{
			name:        "zero to 64 bytes (2 words)",
			currentSize: 0,
			newSize:     64,
			expected:    6, // 3 * 2 + 2^2 / 512 = 6
		},
		{
			name:        "zero to 512 bytes (16 words)",
			currentSize: 0,
			newSize:     512,
			expected:    48, // 3 * 16 + 16^2 / 512 = 48
		},
		{
			name:        "zero to 1024 bytes (32 words)",
			currentSize: 0,
			newSize:     1024,
			expected:    98, // 3 * 32 + 32^2 / 512 = 98
		},
		{
			name:        "1024 to 2048 bytes",
			currentSize: 1024,
			newSize:     2048,
			expected:    102, // (3*64 + 64^2/512) - (3*32 + 32^2/512) = 200 - 98 = 102
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := MemoryGasCost(tt.currentSize, tt.newSize)
			if result != tt.expected {
				t.Errorf("MemoryGasCost() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestWordCount(t *testing.T) {
	tests := []struct {
		name     string
		bytes    uint64
		expected uint64
	}{
		{
			name:     "zero bytes",
			bytes:    0,
			expected: 0,
		},
		{
			name:     "1 byte",
			bytes:    1,
			expected: 1,
		},
		{
			name:     "31 bytes",
			bytes:    31,
			expected: 1,
		},
		{
			name:     "32 bytes (exact word)",
			bytes:    32,
			expected: 1,
		},
		{
			name:     "33 bytes",
			bytes:    33,
			expected: 2,
		},
		{
			name:     "64 bytes",
			bytes:    64,
			expected: 2,
		},
		{
			name:     "100 bytes",
			bytes:    100,
			expected: 4,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := wordCount(tt.bytes)
			if result != tt.expected {
				t.Errorf("wordCount() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestKeccak256GasCost(t *testing.T) {
	tests := []struct {
		name     string
		dataSize uint64
		expected uint64
	}{
		{
			name:     "zero size",
			dataSize: 0,
			expected: 30, // Base cost only
		},
		{
			name:     "32 bytes (1 word)",
			dataSize: 32,
			expected: 36, // 30 + 1*6
		},
		{
			name:     "64 bytes (2 words)",
			dataSize: 64,
			expected: 42, // 30 + 2*6
		},
		{
			name:     "100 bytes (4 words)",
			dataSize: 100,
			expected: 54, // 30 + 4*6
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := Keccak256GasCost(tt.dataSize)
			if result != tt.expected {
				t.Errorf("Keccak256GasCost() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestLogGasCost(t *testing.T) {
	tests := []struct {
		name       string
		topicCount uint8
		dataSize   uint64
		expected   uint64
	}{
		{
			name:       "LOG0 no data",
			topicCount: 0,
			dataSize:   0,
			expected:   375, // Base cost only
		},
		{
			name:       "LOG1 no data",
			topicCount: 1,
			dataSize:   0,
			expected:   750, // 375 + 375
		},
		{
			name:       "LOG4 no data",
			topicCount: 4,
			dataSize:   0,
			expected:   1875, // 375 + 4*375
		},
		{
			name:       "LOG0 with 100 bytes",
			topicCount: 0,
			dataSize:   100,
			expected:   1175, // 375 + 100*8
		},
		{
			name:       "LOG2 with 256 bytes",
			topicCount: 2,
			dataSize:   256,
			expected:   3173, // 375 + 2*375 + 256*8
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := LogGasCost(tt.topicCount, tt.dataSize)
			if result != tt.expected {
				t.Errorf("LogGasCost() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestCopyGasCost(t *testing.T) {
	tests := []struct {
		name     string
		size     uint64
		expected uint64
	}{
		{
			name:     "zero size",
			size:     0,
			expected: 0,
		},
		{
			name:     "32 bytes (1 word)",
			size:     32,
			expected: 3,
		},
		{
			name:     "64 bytes (2 words)",
			size:     64,
			expected: 6,
		},
		{
			name:     "100 bytes (4 words)",
			size:     100,
			expected: 12,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CopyGasCost(tt.size)
			if result != tt.expected {
				t.Errorf("CopyGasCost() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestCreateGasCost(t *testing.T) {
	tests := []struct {
		name         string
		initCodeSize uint64
		expected     uint64
	}{
		{
			name:         "zero size",
			initCodeSize: 0,
			expected:     32000, // Base cost only
		},
		{
			name:         "32 bytes (1 word)",
			initCodeSize: 32,
			expected:     32002, // 32000 + 1*2
		},
		{
			name:         "64 bytes (2 words)",
			initCodeSize: 64,
			expected:     32004, // 32000 + 2*2
		},
		{
			name:         "1024 bytes (32 words)",
			initCodeSize: 1024,
			expected:     32064, // 32000 + 32*2
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CreateGasCost(tt.initCodeSize)
			if result != tt.expected {
				t.Errorf("CreateGasCost() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestCallGasCost(t *testing.T) {
	tests := []struct {
		name          string
		valueTransfer bool
		newAccount    bool
		coldAccess    bool
		expected      uint64
	}{
		{
			name:          "basic warm call",
			valueTransfer: false,
			newAccount:    false,
			coldAccess:    false,
			expected:      40, // Base cost only
		},
		{
			name:          "cold call",
			valueTransfer: false,
			newAccount:    false,
			coldAccess:    true,
			expected:      2640, // 40 + 2600
		},
		{
			name:          "warm call with value",
			valueTransfer: true,
			newAccount:    false,
			coldAccess:    false,
			expected:      9040, // 40 + 9000
		},
		{
			name:          "new account creation",
			valueTransfer: false,
			newAccount:    true,
			coldAccess:    false,
			expected:      25040, // 40 + 25000
		},
		{
			name:          "maximum cost (all flags)",
			valueTransfer: true,
			newAccount:    true,
			coldAccess:    true,
			expected:      36640, // 40 + 2600 + 9000 + 25000
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CallGasCost(tt.valueTransfer, tt.newAccount, tt.coldAccess)
			if result != tt.expected {
				t.Errorf("CallGasCost() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestGasConstants(t *testing.T) {
	// Verify key constants match Ethereum specifications
	tests := []struct {
		name     string
		value    uint64
		expected uint64
	}{
		{"TxGas", TxGas, 21000},
		{"TxGasContractCreation", TxGasContractCreation, 53000},
		{"TxDataZeroGas", TxDataZeroGas, 4},
		{"TxDataNonZeroGas", TxDataNonZeroGas, 16},
		{"CreateGas", CreateGas, 32000},
		{"AccessListAddressCost", AccessListAddressCost, 2400},
		{"AccessListStorageKeyCost", AccessListStorageKeyCost, 1900},
		{"SloadGas", SloadGas, 100},
		{"ColdSloadCost", ColdSloadCost, 2100},
		{"ColdAccountAccessCost", ColdAccountAccessCost, 2600},
		{"SstoreSetGas", SstoreSetGas, 20000},
		{"SstoreResetGas", SstoreResetGas, 5000},
		{"MemoryGas", MemoryGas, 3},
		{"QuadCoeffDiv", QuadCoeffDiv, 512},
		{"Keccak256Gas", Keccak256Gas, 30},
		{"Keccak256WordGas", Keccak256WordGas, 6},
		{"LogGas", LogGas, 375},
		{"LogDataGas", LogDataGas, 8},
		{"LogTopicGas", LogTopicGas, 375},
		{"CopyGas", CopyGas, 3},
		{"CallGas", CallGas, 40},
		{"CallStipend", CallStipend, 2300},
		{"CallValueTransferGas", CallValueTransferGas, 9000},
		{"CallNewAccountGas", CallNewAccountGas, 25000},
		{"BaseFeeMaxChangeDenominator", BaseFeeMaxChangeDenominator, 8},
		{"ElasticityMultiplier", ElasticityMultiplier, 2},
		{"BaseFeeInitial", BaseFeeInitial, 1000000000},
		{"TLoadGas", TLoadGas, 100},
		{"TStoreGas", TStoreGas, 100},
		{"InitcodeWordGas", InitcodeWordGas, 2},
		{"MaxInitcodeSize", MaxInitcodeSize, 49152},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.value != tt.expected {
				t.Errorf("%s = %v, want %v", tt.name, tt.value, tt.expected)
			}
		})
	}
}
