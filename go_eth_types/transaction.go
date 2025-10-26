// Ethereum Transaction Types
//
// This module provides comprehensive support for all Ethereum transaction types,
// from legacy transactions to the latest EIP-4844 blob transactions and
// EIP-7702 authorization lists.
//
// Transaction Types:
// - Legacy (Type 0): Original Ethereum transaction format
// - EIP-2930 (Type 1): Access list support
// - EIP-1559 (Type 2): Priority fee and max fee per gas model
// - EIP-4844 (Type 3): Blob data for layer 2 scaling
// - EIP-7702 (Type 4): EOA delegation to smart contracts

package primitives

import (
	"errors"
	"fmt"
	"math/big"
)

// TransactionType represents the type of Ethereum transaction
type TransactionType byte

const (
	TxTypeLegacy    TransactionType = 0x00
	TxTypeAccessList TransactionType = 0x01
	TxTypeEIP1559    TransactionType = 0x02
	TxTypeBlob       TransactionType = 0x03
	TxTypeSetCode    TransactionType = 0x04
)

// String returns the name of the transaction type
func (t TransactionType) String() string {
	switch t {
	case TxTypeLegacy:
		return "Legacy"
	case TxTypeAccessList:
		return "EIP-2930"
	case TxTypeEIP1559:
		return "EIP-1559"
	case TxTypeBlob:
		return "EIP-4844"
	case TxTypeSetCode:
		return "EIP-7702"
	default:
		return fmt.Sprintf("Unknown(%d)", t)
	}
}

// AccessListItem represents an access list entry
type AccessListItem struct {
	Address     [20]byte
	StorageKeys [][32]byte
}

// Authorization represents an EIP-7702 authorization
type Authorization struct {
	ChainID uint64
	Address [20]byte
	Nonce   uint64
	V       uint64
	R       [32]byte
	S       [32]byte
}

// LegacyTransaction represents a pre-EIP-155 or EIP-155 transaction
type LegacyTransaction struct {
	Nonce    uint64
	GasPrice *big.Int
	GasLimit uint64
	To       *[20]byte // nil for contract creation
	Value    *big.Int
	Data     []byte
	V        uint64
	R        [32]byte
	S        [32]byte
}

// NewLegacyTransaction creates a new legacy transaction
func NewLegacyTransaction(nonce uint64, gasPrice *big.Int, gasLimit uint64, to *[20]byte, value *big.Int, data []byte) *LegacyTransaction {
	return &LegacyTransaction{
		Nonce:    nonce,
		GasPrice: gasPrice,
		GasLimit: gasLimit,
		To:       to,
		Value:    value,
		Data:     data,
	}
}

// Type returns the transaction type
func (tx *LegacyTransaction) Type() TransactionType {
	return TxTypeLegacy
}

// Hash returns the transaction hash (placeholder - requires keccak256)
func (tx *LegacyTransaction) Hash() [32]byte {
	// Placeholder - real implementation would encode and hash
	return [32]byte{}
}

// Validate performs basic validation on the transaction
func (tx *LegacyTransaction) Validate() error {
	if tx.GasPrice == nil {
		return errors.New("gas price cannot be nil")
	}
	if tx.GasPrice.Sign() < 0 {
		return errors.New("gas price cannot be negative")
	}
	if tx.Value == nil {
		return errors.New("value cannot be nil")
	}
	if tx.Value.Sign() < 0 {
		return errors.New("value cannot be negative")
	}
	if tx.GasLimit < 21000 {
		return errors.New("gas limit must be at least 21000")
	}
	return nil
}

// EIP2930Transaction represents an EIP-2930 transaction with access list
type EIP2930Transaction struct {
	ChainID    uint64
	Nonce      uint64
	GasPrice   *big.Int
	GasLimit   uint64
	To         *[20]byte
	Value      *big.Int
	Data       []byte
	AccessList []AccessListItem
	V          uint64
	R          [32]byte
	S          [32]byte
}

// NewEIP2930Transaction creates a new EIP-2930 transaction
func NewEIP2930Transaction(chainID uint64, nonce uint64, gasPrice *big.Int, gasLimit uint64, to *[20]byte, value *big.Int, data []byte, accessList []AccessListItem) *EIP2930Transaction {
	return &EIP2930Transaction{
		ChainID:    chainID,
		Nonce:      nonce,
		GasPrice:   gasPrice,
		GasLimit:   gasLimit,
		To:         to,
		Value:      value,
		Data:       data,
		AccessList: accessList,
	}
}

// Type returns the transaction type
func (tx *EIP2930Transaction) Type() TransactionType {
	return TxTypeAccessList
}

// Validate performs basic validation on the transaction
func (tx *EIP2930Transaction) Validate() error {
	if tx.GasPrice == nil {
		return errors.New("gas price cannot be nil")
	}
	if tx.GasPrice.Sign() < 0 {
		return errors.New("gas price cannot be negative")
	}
	if tx.Value == nil {
		return errors.New("value cannot be nil")
	}
	if tx.Value.Sign() < 0 {
		return errors.New("value cannot be negative")
	}
	if tx.GasLimit < 21000 {
		return errors.New("gas limit must be at least 21000")
	}
	return nil
}

// EIP1559Transaction represents an EIP-1559 transaction with dynamic fees
type EIP1559Transaction struct {
	ChainID              uint64
	Nonce                uint64
	MaxPriorityFeePerGas *big.Int
	MaxFeePerGas         *big.Int
	GasLimit             uint64
	To                   *[20]byte
	Value                *big.Int
	Data                 []byte
	AccessList           []AccessListItem
	V                    uint64
	R                    [32]byte
	S                    [32]byte
}

// NewEIP1559Transaction creates a new EIP-1559 transaction
func NewEIP1559Transaction(chainID uint64, nonce uint64, maxPriorityFee, maxFee *big.Int, gasLimit uint64, to *[20]byte, value *big.Int, data []byte, accessList []AccessListItem) *EIP1559Transaction {
	return &EIP1559Transaction{
		ChainID:              chainID,
		Nonce:                nonce,
		MaxPriorityFeePerGas: maxPriorityFee,
		MaxFeePerGas:         maxFee,
		GasLimit:             gasLimit,
		To:                   to,
		Value:                value,
		Data:                 data,
		AccessList:           accessList,
	}
}

// Type returns the transaction type
func (tx *EIP1559Transaction) Type() TransactionType {
	return TxTypeEIP1559
}

// Validate performs basic validation on the transaction
func (tx *EIP1559Transaction) Validate() error {
	if tx.MaxPriorityFeePerGas == nil {
		return errors.New("max priority fee cannot be nil")
	}
	if tx.MaxPriorityFeePerGas.Sign() < 0 {
		return errors.New("max priority fee cannot be negative")
	}
	if tx.MaxFeePerGas == nil {
		return errors.New("max fee per gas cannot be nil")
	}
	if tx.MaxFeePerGas.Sign() < 0 {
		return errors.New("max fee per gas cannot be negative")
	}
	if tx.MaxPriorityFeePerGas.Cmp(tx.MaxFeePerGas) > 0 {
		return errors.New("max priority fee cannot exceed max fee per gas")
	}
	if tx.Value == nil {
		return errors.New("value cannot be nil")
	}
	if tx.Value.Sign() < 0 {
		return errors.New("value cannot be negative")
	}
	if tx.GasLimit < 21000 {
		return errors.New("gas limit must be at least 21000")
	}
	return nil
}

// EIP4844Transaction represents an EIP-4844 blob transaction
type EIP4844Transaction struct {
	ChainID              uint64
	Nonce                uint64
	MaxPriorityFeePerGas *big.Int
	MaxFeePerGas         *big.Int
	GasLimit             uint64
	To                   [20]byte // Must be set for blob transactions
	Value                *big.Int
	Data                 []byte
	AccessList           []AccessListItem
	MaxFeePerBlobGas     *big.Int
	BlobVersionedHashes  [][32]byte
	V                    uint64
	R                    [32]byte
	S                    [32]byte
}

// NewEIP4844Transaction creates a new EIP-4844 blob transaction
func NewEIP4844Transaction(chainID uint64, nonce uint64, maxPriorityFee, maxFee *big.Int, gasLimit uint64, to [20]byte, value *big.Int, data []byte, maxFeePerBlobGas *big.Int, blobHashes [][32]byte) *EIP4844Transaction {
	return &EIP4844Transaction{
		ChainID:              chainID,
		Nonce:                nonce,
		MaxPriorityFeePerGas: maxPriorityFee,
		MaxFeePerGas:         maxFee,
		GasLimit:             gasLimit,
		To:                   to,
		Value:                value,
		Data:                 data,
		MaxFeePerBlobGas:     maxFeePerBlobGas,
		BlobVersionedHashes:  blobHashes,
	}
}

// Type returns the transaction type
func (tx *EIP4844Transaction) Type() TransactionType {
	return TxTypeBlob
}

// Validate performs basic validation on the transaction
func (tx *EIP4844Transaction) Validate() error {
	if tx.MaxPriorityFeePerGas == nil {
		return errors.New("max priority fee cannot be nil")
	}
	if tx.MaxFeePerGas == nil {
		return errors.New("max fee per gas cannot be nil")
	}
	if tx.MaxFeePerBlobGas == nil {
		return errors.New("max fee per blob gas cannot be nil")
	}
	if tx.Value == nil {
		return errors.New("value cannot be nil")
	}
	if len(tx.BlobVersionedHashes) == 0 {
		return errors.New("blob transaction must have at least one blob hash")
	}
	if len(tx.BlobVersionedHashes) > 6 {
		return errors.New("blob transaction cannot have more than 6 blobs")
	}
	return nil
}

// EIP7702Transaction represents an EIP-7702 set code transaction
type EIP7702Transaction struct {
	ChainID              uint64
	Nonce                uint64
	MaxPriorityFeePerGas *big.Int
	MaxFeePerGas         *big.Int
	GasLimit             uint64
	To                   *[20]byte
	Value                *big.Int
	Data                 []byte
	AccessList           []AccessListItem
	AuthorizationList    []Authorization
	V                    uint64
	R                    [32]byte
	S                    [32]byte
}

// NewEIP7702Transaction creates a new EIP-7702 transaction
func NewEIP7702Transaction(chainID uint64, nonce uint64, maxPriorityFee, maxFee *big.Int, gasLimit uint64, to *[20]byte, value *big.Int, data []byte, authList []Authorization) *EIP7702Transaction {
	return &EIP7702Transaction{
		ChainID:              chainID,
		Nonce:                nonce,
		MaxPriorityFeePerGas: maxPriorityFee,
		MaxFeePerGas:         maxFee,
		GasLimit:             gasLimit,
		To:                   to,
		Value:                value,
		Data:                 data,
		AuthorizationList:    authList,
	}
}

// Type returns the transaction type
func (tx *EIP7702Transaction) Type() TransactionType {
	return TxTypeSetCode
}

// Validate performs basic validation on the transaction
func (tx *EIP7702Transaction) Validate() error {
	if tx.MaxPriorityFeePerGas == nil {
		return errors.New("max priority fee cannot be nil")
	}
	if tx.MaxFeePerGas == nil {
		return errors.New("max fee per gas cannot be nil")
	}
	if tx.Value == nil {
		return errors.New("value cannot be nil")
	}
	return nil
}

// Transaction is an interface for all transaction types
type Transaction interface {
	Type() TransactionType
	Validate() error
}

// DetectTransactionType detects the transaction type from raw data
func DetectTransactionType(data []byte) TransactionType {
	if len(data) == 0 {
		return TxTypeLegacy
	}

	// Check for typed transaction envelope
	if data[0] <= 0x7f {
		switch data[0] {
		case 0x01:
			return TxTypeAccessList
		case 0x02:
			return TxTypeEIP1559
		case 0x03:
			return TxTypeBlob
		case 0x04:
			return TxTypeSetCode
		}
	}

	return TxTypeLegacy
}

// ValidateSignature validates the signature components (simplified)
func ValidateSignature(v uint64, r, s [32]byte) error {
	// Check that r and s are not zero
	isRZero := true
	for _, b := range r {
		if b != 0 {
			isRZero = false
			break
		}
	}
	if isRZero {
		return errors.New("r cannot be zero")
	}

	isSZero := true
	for _, b := range s {
		if b != 0 {
			isSZero = false
			break
		}
	}
	if isSZero {
		return errors.New("s cannot be zero")
	}

	// Check for high s values (EIP-2)
	// s should be in the lower half of the curve order
	// This is a simplified check
	if s[0] > 0x7f {
		return errors.New("s value is too high (EIP-2)")
	}

	return nil
}

// HexToBytes converts a hex string to bytes
func HexToBytes(hexStr string) ([]byte, error) {
	cleaned := hexStr
	if len(hexStr) >= 2 && hexStr[0:2] == "0x" {
		cleaned = hexStr[2:]
	}
	decoded := make([]byte, len(cleaned)/2)
	for i := 0; i < len(cleaned); i += 2 {
		var b byte
		_, err := fmt.Sscanf(cleaned[i:i+2], "%02x", &b)
		if err != nil {
			return nil, err
		}
		decoded[i/2] = b
	}
	return decoded, nil
}

// BytesToHex converts bytes to a hex string
func BytesToHex(data []byte) string {
	hex := "0x"
	for _, b := range data {
		hex += fmt.Sprintf("%02x", b)
	}
	return hex
}
