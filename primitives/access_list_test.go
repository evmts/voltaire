package primitives

import (
	"encoding/hex"
	"testing"
)

func TestCalculateAccessListGasCost(t *testing.T) {
	tests := []struct {
		name       string
		accessList AccessList
		expected   uint64
	}{
		{
			name:       "empty access list",
			accessList: AccessList{},
			expected:   0,
		},
		{
			name: "single address no storage keys",
			accessList: AccessList{
				{
					Address:     [20]byte{0x11},
					StorageKeys: [][32]byte{},
				},
			},
			expected: 2400, // 1 address * 2400
		},
		{
			name: "single address with storage keys",
			accessList: AccessList{
				{
					Address: [20]byte{0x11},
					StorageKeys: [][32]byte{
						{0x01},
						{0x02},
					},
				},
			},
			expected: 2400 + 2*1900, // 1 address + 2 keys
		},
		{
			name: "multiple addresses",
			accessList: AccessList{
				{
					Address: [20]byte{0x11},
					StorageKeys: [][32]byte{
						{0x01},
						{0x02},
					},
				},
				{
					Address:     [20]byte{0x22},
					StorageKeys: [][32]byte{},
				},
			},
			expected: 2*2400 + 2*1900, // 2 addresses + 2 keys = 8600
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CalculateAccessListGasCost(tt.accessList)
			if result != tt.expected {
				t.Errorf("CalculateAccessListGasCost() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestIsAddressInAccessList(t *testing.T) {
	accessList := AccessList{
		{
			Address: [20]byte{0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11},
			StorageKeys: [][32]byte{
				{0x01},
			},
		},
		{
			Address: [20]byte{0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22},
			StorageKeys: [][32]byte{},
		},
	}

	tests := []struct {
		name     string
		addr     [20]byte
		expected bool
	}{
		{
			name:     "address in list (first)",
			addr:     [20]byte{0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11},
			expected: true,
		},
		{
			name:     "address in list (second)",
			addr:     [20]byte{0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22},
			expected: true,
		},
		{
			name:     "address not in list",
			addr:     [20]byte{0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33},
			expected: false,
		},
		{
			name:     "zero address not in list",
			addr:     [20]byte{},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsAddressInAccessList(accessList, tt.addr)
			if result != tt.expected {
				t.Errorf("IsAddressInAccessList() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestIsStorageKeyInAccessList(t *testing.T) {
	accessList := AccessList{
		{
			Address: [20]byte{0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11},
			StorageKeys: [][32]byte{
				{0x01},
				{0x02},
			},
		},
		{
			Address:     [20]byte{0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22},
			StorageKeys: [][32]byte{},
		},
	}

	tests := []struct {
		name       string
		addr       [20]byte
		storageKey [32]byte
		expected   bool
	}{
		{
			name:       "key in list for address",
			addr:       [20]byte{0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11},
			storageKey: [32]byte{0x01},
			expected:   true,
		},
		{
			name:       "key not in list for address",
			addr:       [20]byte{0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11},
			storageKey: [32]byte{0x03},
			expected:   false,
		},
		{
			name:       "address not in list",
			addr:       [20]byte{0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33},
			storageKey: [32]byte{0x01},
			expected:   false,
		},
		{
			name:       "address with no storage keys",
			addr:       [20]byte{0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22},
			storageKey: [32]byte{0x01},
			expected:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsStorageKeyInAccessList(accessList, tt.addr, tt.storageKey)
			if result != tt.expected {
				t.Errorf("IsStorageKeyInAccessList() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestCalculateGasSavings(t *testing.T) {
	tests := []struct {
		name       string
		accessList AccessList
		expected   uint64
	}{
		{
			name:       "empty access list",
			accessList: AccessList{},
			expected:   0,
		},
		{
			name: "single address no storage keys",
			accessList: AccessList{
				{
					Address:     [20]byte{0x11},
					StorageKeys: [][32]byte{},
				},
			},
			expected: ColdAccountAccessCost - AccessListAddressCost, // 200
		},
		{
			name: "single address with storage keys",
			accessList: AccessList{
				{
					Address: [20]byte{0x11},
					StorageKeys: [][32]byte{
						{0x01},
						{0x02},
					},
				},
			},
			// Account: 2600 - 2400 = 200
			// Storage keys: 2 * (2100 - 1900) = 400
			// Total: 600
			expected: 200 + 400,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CalculateGasSavings(tt.accessList)
			if result != tt.expected {
				t.Errorf("CalculateGasSavings() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestDeduplicateAccessList(t *testing.T) {
	t.Run("no duplicates", func(t *testing.T) {
		accessList := AccessList{
			{
				Address: [20]byte{0x11},
				StorageKeys: [][32]byte{
					{0x01},
					{0x02},
				},
			},
			{
				Address: [20]byte{0x22},
				StorageKeys: [][32]byte{
					{0x03},
				},
			},
		}

		result := DeduplicateAccessList(accessList)

		if len(result) != 2 {
			t.Errorf("Expected 2 entries, got %d", len(result))
		}

		if len(result[0].StorageKeys) != 2 {
			t.Errorf("Expected 2 storage keys for first entry, got %d", len(result[0].StorageKeys))
		}

		if len(result[1].StorageKeys) != 1 {
			t.Errorf("Expected 1 storage key for second entry, got %d", len(result[1].StorageKeys))
		}
	})

	t.Run("duplicate addresses", func(t *testing.T) {
		accessList := AccessList{
			{
				Address: [20]byte{0x11},
				StorageKeys: [][32]byte{
					{0x01},
					{0x02},
				},
			},
			{
				Address: [20]byte{0x11}, // Same address
				StorageKeys: [][32]byte{
					{0x02}, // Duplicate key
					{0x03}, // New key
				},
			},
		}

		result := DeduplicateAccessList(accessList)

		if len(result) != 1 {
			t.Errorf("Expected 1 entry after deduplication, got %d", len(result))
		}

		if len(result[0].StorageKeys) != 3 {
			t.Errorf("Expected 3 unique storage keys, got %d", len(result[0].StorageKeys))
		}
	})

	t.Run("duplicate storage keys within entry", func(t *testing.T) {
		accessList := AccessList{
			{
				Address: [20]byte{0x11},
				StorageKeys: [][32]byte{
					{0x01},
					{0x01}, // Duplicate
					{0x02},
				},
			},
		}

		result := DeduplicateAccessList(accessList)

		if len(result) != 1 {
			t.Errorf("Expected 1 entry, got %d", len(result))
		}

		if len(result[0].StorageKeys) != 2 {
			t.Errorf("Expected 2 unique storage keys, got %d", len(result[0].StorageKeys))
		}
	})
}

func TestValidateAccessList(t *testing.T) {
	tests := []struct {
		name       string
		accessList AccessList
		wantErr    bool
	}{
		{
			name:       "empty access list",
			accessList: AccessList{},
			wantErr:    false,
		},
		{
			name: "valid access list",
			accessList: AccessList{
				{
					Address: [20]byte{0x11},
					StorageKeys: [][32]byte{
						{0x01},
					},
				},
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateAccessList(tt.accessList)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateAccessList() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestCountAccessListItems(t *testing.T) {
	tests := []struct {
		name                    string
		accessList              AccessList
		expectedAddressCount    uint64
		expectedStorageKeyCount uint64
	}{
		{
			name:                    "empty access list",
			accessList:              AccessList{},
			expectedAddressCount:    0,
			expectedStorageKeyCount: 0,
		},
		{
			name: "single address no storage keys",
			accessList: AccessList{
				{
					Address:     [20]byte{0x11},
					StorageKeys: [][32]byte{},
				},
			},
			expectedAddressCount:    1,
			expectedStorageKeyCount: 0,
		},
		{
			name: "multiple addresses with storage keys",
			accessList: AccessList{
				{
					Address: [20]byte{0x11},
					StorageKeys: [][32]byte{
						{0x01},
						{0x02},
					},
				},
				{
					Address: [20]byte{0x22},
					StorageKeys: [][32]byte{
						{0x03},
					},
				},
				{
					Address:     [20]byte{0x33},
					StorageKeys: [][32]byte{},
				},
			},
			expectedAddressCount:    3,
			expectedStorageKeyCount: 3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			addressCount, storageKeyCount := CountAccessListItems(tt.accessList)
			if addressCount != tt.expectedAddressCount {
				t.Errorf("AddressCount = %v, want %v", addressCount, tt.expectedAddressCount)
			}
			if storageKeyCount != tt.expectedStorageKeyCount {
				t.Errorf("StorageKeyCount = %v, want %v", storageKeyCount, tt.expectedStorageKeyCount)
			}
		})
	}
}

func TestRealWorldAccessList(t *testing.T) {
	// Simulate a real-world access list for a Uniswap swap
	addr1, _ := hex.DecodeString("1111111111111111111111111111111111111111")
	addr2, _ := hex.DecodeString("2222222222222222222222222222222222222222")

	var address1, address2 [20]byte
	copy(address1[:], addr1)
	copy(address2[:], addr2)

	accessList := AccessList{
		{
			Address: address1,
			StorageKeys: [][32]byte{
				{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01},
				{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02},
			},
		},
		{
			Address: address2,
			StorageKeys: [][32]byte{
				{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03},
			},
		},
	}

	// Test gas cost calculation
	gasCost := CalculateAccessListGasCost(accessList)
	expectedCost := uint64(2*AccessListAddressCost + 3*AccessListStorageKeyCost)
	if gasCost != expectedCost {
		t.Errorf("Gas cost = %v, want %v", gasCost, expectedCost)
	}

	// Test gas savings
	savings := CalculateGasSavings(accessList)
	expectedSavings := uint64(2*(ColdAccountAccessCost-AccessListAddressCost) + 3*(ColdSloadCost-AccessListStorageKeyCost))
	if savings != expectedSavings {
		t.Errorf("Gas savings = %v, want %v", savings, expectedSavings)
	}

	// Test address lookup
	if !IsAddressInAccessList(accessList, address1) {
		t.Error("Address1 should be in access list")
	}
	if !IsAddressInAccessList(accessList, address2) {
		t.Error("Address2 should be in access list")
	}
}
