package primitives

import (
	"math/big"
	"testing"
)

func TestLegacyTransactionCreation(t *testing.T) {
	gasPrice := big.NewInt(20000000000) // 20 gwei
	value := big.NewInt(1000000000000000) // 0.001 ETH
	to := [20]byte{0x01, 0x02, 0x03}

	tx := NewLegacyTransaction(0, gasPrice, 21000, &to, value, []byte{})

	if tx.Nonce != 0 {
		t.Errorf("Nonce = %d, want 0", tx.Nonce)
	}

	if tx.GasLimit != 21000 {
		t.Errorf("GasLimit = %d, want 21000", tx.GasLimit)
	}

	if tx.GasPrice.Cmp(gasPrice) != 0 {
		t.Errorf("GasPrice mismatch")
	}

	if tx.Type() != TxTypeLegacy {
		t.Errorf("Type() = %v, want %v", tx.Type(), TxTypeLegacy)
	}
}

func TestLegacyTransactionValidation(t *testing.T) {
	tests := []struct {
		name    string
		tx      *LegacyTransaction
		wantErr bool
	}{
		{
			name: "valid transaction",
			tx: &LegacyTransaction{
				Nonce:    0,
				GasPrice: big.NewInt(1000000000),
				GasLimit: 21000,
				Value:    big.NewInt(0),
				Data:     []byte{},
			},
			wantErr: false,
		},
		{
			name: "nil gas price",
			tx: &LegacyTransaction{
				Nonce:    0,
				GasPrice: nil,
				GasLimit: 21000,
				Value:    big.NewInt(0),
			},
			wantErr: true,
		},
		{
			name: "negative gas price",
			tx: &LegacyTransaction{
				Nonce:    0,
				GasPrice: big.NewInt(-1),
				GasLimit: 21000,
				Value:    big.NewInt(0),
			},
			wantErr: true,
		},
		{
			name: "gas limit too low",
			tx: &LegacyTransaction{
				Nonce:    0,
				GasPrice: big.NewInt(1000000000),
				GasLimit: 20999,
				Value:    big.NewInt(0),
			},
			wantErr: true,
		},
		{
			name: "nil value",
			tx: &LegacyTransaction{
				Nonce:    0,
				GasPrice: big.NewInt(1000000000),
				GasLimit: 21000,
				Value:    nil,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.tx.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestEIP1559TransactionCreation(t *testing.T) {
	maxPriorityFee := big.NewInt(2000000000) // 2 gwei
	maxFee := big.NewInt(20000000000)        // 20 gwei
	value := big.NewInt(1000000000000000)    // 0.001 ETH
	to := [20]byte{0x01, 0x02, 0x03}

	tx := NewEIP1559Transaction(1, 0, maxPriorityFee, maxFee, 21000, &to, value, []byte{}, []AccessListItem{})

	if tx.ChainID != 1 {
		t.Errorf("ChainID = %d, want 1", tx.ChainID)
	}

	if tx.Type() != TxTypeEIP1559 {
		t.Errorf("Type() = %v, want %v", tx.Type(), TxTypeEIP1559)
	}
}

func TestEIP1559TransactionValidation(t *testing.T) {
	tests := []struct {
		name    string
		tx      *EIP1559Transaction
		wantErr bool
	}{
		{
			name: "valid transaction",
			tx: &EIP1559Transaction{
				ChainID:              1,
				Nonce:                0,
				MaxPriorityFeePerGas: big.NewInt(1000000000),
				MaxFeePerGas:         big.NewInt(20000000000),
				GasLimit:             21000,
				Value:                big.NewInt(0),
			},
			wantErr: false,
		},
		{
			name: "priority fee exceeds max fee",
			tx: &EIP1559Transaction{
				ChainID:              1,
				Nonce:                0,
				MaxPriorityFeePerGas: big.NewInt(20000000000),
				MaxFeePerGas:         big.NewInt(1000000000),
				GasLimit:             21000,
				Value:                big.NewInt(0),
			},
			wantErr: true,
		},
		{
			name: "nil max priority fee",
			tx: &EIP1559Transaction{
				ChainID:              1,
				Nonce:                0,
				MaxPriorityFeePerGas: nil,
				MaxFeePerGas:         big.NewInt(20000000000),
				GasLimit:             21000,
				Value:                big.NewInt(0),
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.tx.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestEIP4844TransactionCreation(t *testing.T) {
	maxPriorityFee := big.NewInt(2000000000)
	maxFee := big.NewInt(20000000000)
	maxFeePerBlobGas := big.NewInt(1000000000)
	value := big.NewInt(0)
	to := [20]byte{0x01, 0x02, 0x03}
	blobHash := [32]byte{0x04, 0x05, 0x06}

	tx := NewEIP4844Transaction(1, 0, maxPriorityFee, maxFee, 100000, to, value, []byte{}, maxFeePerBlobGas, [][32]byte{blobHash})

	if tx.Type() != TxTypeBlob {
		t.Errorf("Type() = %v, want %v", tx.Type(), TxTypeBlob)
	}

	if len(tx.BlobVersionedHashes) != 1 {
		t.Errorf("BlobVersionedHashes length = %d, want 1", len(tx.BlobVersionedHashes))
	}
}

func TestEIP4844TransactionValidation(t *testing.T) {
	maxPriorityFee := big.NewInt(2000000000)
	maxFee := big.NewInt(20000000000)
	maxFeePerBlobGas := big.NewInt(1000000000)
	value := big.NewInt(0)
	to := [20]byte{0x01}
	blobHash := [32]byte{0x02}

	tests := []struct {
		name    string
		tx      *EIP4844Transaction
		wantErr bool
	}{
		{
			name: "valid transaction",
			tx: &EIP4844Transaction{
				ChainID:              1,
				MaxPriorityFeePerGas: maxPriorityFee,
				MaxFeePerGas:         maxFee,
				MaxFeePerBlobGas:     maxFeePerBlobGas,
				Value:                value,
				To:                   to,
				BlobVersionedHashes:  [][32]byte{blobHash},
			},
			wantErr: false,
		},
		{
			name: "no blob hashes",
			tx: &EIP4844Transaction{
				ChainID:              1,
				MaxPriorityFeePerGas: maxPriorityFee,
				MaxFeePerGas:         maxFee,
				MaxFeePerBlobGas:     maxFeePerBlobGas,
				Value:                value,
				To:                   to,
				BlobVersionedHashes:  [][32]byte{},
			},
			wantErr: true,
		},
		{
			name: "too many blobs",
			tx: &EIP4844Transaction{
				ChainID:              1,
				MaxPriorityFeePerGas: maxPriorityFee,
				MaxFeePerGas:         maxFee,
				MaxFeePerBlobGas:     maxFeePerBlobGas,
				Value:                value,
				To:                   to,
				BlobVersionedHashes:  make([][32]byte, 7),
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.tx.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestEIP7702TransactionCreation(t *testing.T) {
	maxPriorityFee := big.NewInt(2000000000)
	maxFee := big.NewInt(20000000000)
	value := big.NewInt(0)
	to := [20]byte{0x01, 0x02, 0x03}

	auth := Authorization{
		ChainID: 1,
		Address: [20]byte{0x04, 0x05},
		Nonce:   0,
	}

	tx := NewEIP7702Transaction(1, 0, maxPriorityFee, maxFee, 100000, &to, value, []byte{}, []Authorization{auth})

	if tx.Type() != TxTypeSetCode {
		t.Errorf("Type() = %v, want %v", tx.Type(), TxTypeSetCode)
	}

	if len(tx.AuthorizationList) != 1 {
		t.Errorf("AuthorizationList length = %d, want 1", len(tx.AuthorizationList))
	}
}

func TestAccessListItem(t *testing.T) {
	address := [20]byte{0x01, 0x02, 0x03}
	key1 := [32]byte{0x04, 0x05, 0x06}
	key2 := [32]byte{0x07, 0x08, 0x09}

	item := AccessListItem{
		Address:     address,
		StorageKeys: [][32]byte{key1, key2},
	}

	if item.Address != address {
		t.Error("Address mismatch")
	}

	if len(item.StorageKeys) != 2 {
		t.Errorf("StorageKeys length = %d, want 2", len(item.StorageKeys))
	}
}

func TestDetectTransactionType(t *testing.T) {
	tests := []struct {
		name     string
		data     []byte
		expected TransactionType
	}{
		{"empty data", []byte{}, TxTypeLegacy},
		{"legacy RLP", []byte{0xf8, 0x6c}, TxTypeLegacy},
		{"EIP-2930", []byte{0x01, 0xf8}, TxTypeAccessList},
		{"EIP-1559", []byte{0x02, 0xf8}, TxTypeEIP1559},
		{"EIP-4844", []byte{0x03, 0xf8}, TxTypeBlob},
		{"EIP-7702", []byte{0x04, 0xf8}, TxTypeSetCode},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := DetectTransactionType(tt.data)
			if result != tt.expected {
				t.Errorf("DetectTransactionType() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestValidateSignature(t *testing.T) {
	validR := [32]byte{0x01, 0x02, 0x03}
	validS := [32]byte{0x04, 0x05, 0x06}
	zeroR := [32]byte{}
	zeroS := [32]byte{}
	highS := [32]byte{0xff, 0xff, 0xff}

	tests := []struct {
		name    string
		v       uint64
		r       [32]byte
		s       [32]byte
		wantErr bool
	}{
		{"valid signature", 27, validR, validS, false},
		{"zero r", 27, zeroR, validS, true},
		{"zero s", 27, validR, zeroS, true},
		{"high s (EIP-2)", 27, validR, highS, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateSignature(tt.v, tt.r, tt.s)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateSignature() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestTransactionTypeString(t *testing.T) {
	tests := []struct {
		txType   TransactionType
		expected string
	}{
		{TxTypeLegacy, "Legacy"},
		{TxTypeAccessList, "EIP-2930"},
		{TxTypeEIP1559, "EIP-1559"},
		{TxTypeBlob, "EIP-4844"},
		{TxTypeSetCode, "EIP-7702"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := tt.txType.String()
			if result != tt.expected {
				t.Errorf("String() = %s, want %s", result, tt.expected)
			}
		})
	}
}

func TestContractCreation(t *testing.T) {
	// Contract creation has nil 'to' address
	gasPrice := big.NewInt(20000000000)
	value := big.NewInt(0)
	initCode := []byte{0x60, 0x80, 0x60, 0x40, 0x52} // Sample init code

	tx := NewLegacyTransaction(0, gasPrice, 100000, nil, value, initCode)

	if tx.To != nil {
		t.Error("Contract creation should have nil 'to' address")
	}

	if len(tx.Data) != len(initCode) {
		t.Errorf("Data length = %d, want %d", len(tx.Data), len(initCode))
	}
}

func TestHexHelpers(t *testing.T) {
	tests := []struct {
		name     string
		hexStr   string
		expected []byte
	}{
		{"with 0x prefix", "0x0102", []byte{0x01, 0x02}},
		{"without prefix", "0102", []byte{0x01, 0x02}},
		{"empty", "", []byte{}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := HexToBytes(tt.hexStr)
			if err != nil {
				if len(tt.expected) > 0 {
					t.Errorf("HexToBytes() error = %v", err)
				}
				return
			}

			if len(result) != len(tt.expected) {
				t.Errorf("HexToBytes() length = %d, want %d", len(result), len(tt.expected))
				return
			}

			for i, b := range result {
				if b != tt.expected[i] {
					t.Errorf("HexToBytes()[%d] = %x, want %x", i, b, tt.expected[i])
				}
			}
		})
	}
}

func TestBytesToHex(t *testing.T) {
	data := []byte{0x01, 0x02, 0x03}
	expected := "0x010203"

	result := BytesToHex(data)
	if result != expected {
		t.Errorf("BytesToHex() = %s, want %s", result, expected)
	}
}
