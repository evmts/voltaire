// Package primitives implements Ethereum primitive types and utilities
package primitives

// Gas cost constants for EVM operations and transactions
// These constants define the gas costs for various operations in the Ethereum Virtual Machine.

// Transaction base costs
const (
	// TxGas is the base gas cost for any transaction
	TxGas uint64 = 21000

	// TxGasContractCreation is the base gas cost for contract creation transactions
	TxGasContractCreation uint64 = 53000

	// TxDataZeroGas is the gas cost per zero byte in transaction data
	TxDataZeroGas uint64 = 4

	// TxDataNonZeroGas is the gas cost per non-zero byte in transaction data
	TxDataNonZeroGas uint64 = 16

	// CreateGas is the base gas cost for CREATE opcode
	CreateGas uint64 = 32000
)

// Access list costs (EIP-2930)
const (
	// AccessListAddressCost is the gas cost per address in the access list
	AccessListAddressCost uint64 = 2400

	// AccessListStorageKeyCost is the gas cost per storage key in the access list
	AccessListStorageKeyCost uint64 = 1900
)

// Storage operation costs (EIP-2929 & EIP-2200)
const (
	// SloadGas is the gas cost for SLOAD on a warm storage slot
	SloadGas uint64 = 100

	// ColdSloadCost is the gas cost for first-time (cold) SLOAD access
	ColdSloadCost uint64 = 2100

	// ColdAccountAccessCost is the gas cost for first-time (cold) account access
	ColdAccountAccessCost uint64 = 2600

	// WarmStorageReadCost is the gas cost for warm storage read operations
	WarmStorageReadCost uint64 = 100

	// SstoreSetGas is the gas cost for setting a storage slot from zero to non-zero
	SstoreSetGas uint64 = 20000

	// SstoreResetGas is the gas cost for changing an existing non-zero value
	SstoreResetGas uint64 = 5000

	// SstoreClearGas is the gas cost for clearing a storage slot (non-zero to zero)
	SstoreClearGas uint64 = 5000

	// SstoreRefundGas is the gas refund for clearing storage slot to zero
	SstoreRefundGas uint64 = 4800
)

// Memory expansion costs
const (
	// MemoryGas is the linear coefficient for memory gas calculation
	MemoryGas uint64 = 3

	// QuadCoeffDiv is the quadratic coefficient divisor for memory gas calculation
	QuadCoeffDiv uint64 = 512
)

// Call operation costs
const (
	// CallGas is the base gas cost for CALL operations
	CallGas uint64 = 40

	// CallStipend is the gas stipend provided when transferring value
	CallStipend uint64 = 2300

	// CallValueTransferGas is the additional gas cost when CALL transfers value
	CallValueTransferGas uint64 = 9000

	// CallNewAccountGas is the additional gas cost when CALL creates a new account
	CallNewAccountGas uint64 = 25000
)

// Hashing operation costs
const (
	// Keccak256Gas is the base gas cost for KECCAK256 operation
	Keccak256Gas uint64 = 30

	// Keccak256WordGas is the additional gas cost per 32-byte word for KECCAK256
	Keccak256WordGas uint64 = 6
)

// Logging operation costs
const (
	// LogGas is the base gas cost for LOG operations
	LogGas uint64 = 375

	// LogDataGas is the gas cost per byte of data in LOG operations
	LogDataGas uint64 = 8

	// LogTopicGas is the gas cost per topic in LOG operations
	LogTopicGas uint64 = 375
)

// Copy operation costs
const (
	// CopyGas is the gas cost per word for copy operations
	CopyGas uint64 = 3
)

// EIP-1559 constants
const (
	// BaseFeeMaxChangeDenominator is the denominator for base fee max change (12.5%)
	BaseFeeMaxChangeDenominator uint64 = 8

	// ElasticityMultiplier is the elasticity multiplier for gas limit
	ElasticityMultiplier uint64 = 2

	// BaseFeeInitial is the initial base fee (1 gwei)
	BaseFeeInitial uint64 = 1000000000
)

// EIP-4844 Blob transaction costs
const (
	// BlobHashGas is the gas cost for BLOBHASH opcode
	BlobHashGas uint64 = 3

	// BlobBaseFeeGas is the gas cost for BLOBBASEFEE opcode
	BlobBaseFeeGas uint64 = 2
)

// EIP-1153 Transient storage costs
const (
	// TLoadGas is the gas cost for TLOAD (transient storage load)
	TLoadGas uint64 = 100

	// TStoreGas is the gas cost for TSTORE (transient storage store)
	TStoreGas uint64 = 100
)

// EIP-3860 Shanghai constants
const (
	// InitcodeWordGas is the gas cost per 32-byte word of initcode
	InitcodeWordGas uint64 = 2

	// MaxInitcodeSize is the maximum allowed initcode size in bytes
	MaxInitcodeSize uint64 = 49152
)

// IntrinsicGas calculates the intrinsic gas cost for a transaction based on its data.
// This includes the base transaction cost plus the cost of transaction data.
//
// Parameters:
//   - data: The transaction data bytes
//   - isContractCreation: Whether this is a contract creation transaction
//   - accessListAddressCount: Number of addresses in the access list (EIP-2930)
//   - accessListStorageKeyCount: Number of storage keys in the access list (EIP-2930)
//
// Returns:
//   - The intrinsic gas cost
func IntrinsicGas(data []byte, isContractCreation bool, accessListAddressCount, accessListStorageKeyCount uint64) uint64 {
	var gas uint64

	// Base transaction cost
	if isContractCreation {
		gas = TxGasContractCreation
	} else {
		gas = TxGas
	}

	// Data cost
	gas += CalldataGasCost(data)

	// Access list cost (EIP-2930)
	gas += accessListAddressCount * AccessListAddressCost
	gas += accessListStorageKeyCount * AccessListStorageKeyCost

	return gas
}

// CalldataGasCost calculates the gas cost for transaction calldata.
// Zero bytes cost 4 gas each, non-zero bytes cost 16 gas each.
//
// Parameters:
//   - data: The calldata bytes
//
// Returns:
//   - The total gas cost for the calldata
func CalldataGasCost(data []byte) uint64 {
	var gas uint64

	for _, b := range data {
		if b == 0 {
			gas += TxDataZeroGas
		} else {
			gas += TxDataNonZeroGas
		}
	}

	return gas
}

// MemoryGasCost calculates the gas cost for memory expansion.
// Memory expansion follows a quadratic cost formula to prevent DoS attacks.
// Formula: gas = 3 * words + words^2 / 512
//
// Parameters:
//   - currentSize: Current memory size in bytes
//   - newSize: Requested new memory size in bytes
//
// Returns:
//   - Gas cost for the expansion (0 if newSize <= currentSize)
func MemoryGasCost(currentSize, newSize uint64) uint64 {
	if newSize <= currentSize {
		return 0
	}

	currentWords := wordCount(currentSize)
	newWords := wordCount(newSize)

	// Calculate cost for each size
	currentCost := MemoryGas*currentWords + (currentWords*currentWords)/QuadCoeffDiv
	newCost := MemoryGas*newWords + (newWords*newWords)/QuadCoeffDiv

	return newCost - currentCost
}

// wordCount calculates the number of 32-byte words required for a given byte size.
// This is a shared utility function used throughout the EVM for gas calculations.
//
// Parameters:
//   - bytes: Size in bytes
//
// Returns:
//   - Number of 32-byte words (rounded up)
func wordCount(bytes uint64) uint64 {
	// word_count = ceil(bytes / 32) = (bytes + 31) / 32
	return (bytes + 31) / 32
}

// Keccak256GasCost calculates the gas cost for KECCAK256 operations.
// Hash operations have a base cost plus a per-word cost for the data being hashed.
//
// Parameters:
//   - dataSize: Size of data being hashed in bytes
//
// Returns:
//   - Gas cost for the hash operation
func Keccak256GasCost(dataSize uint64) uint64 {
	words := wordCount(dataSize)
	return Keccak256Gas + (words * Keccak256WordGas)
}

// LogGasCost calculates the gas cost for LOG operations (LOG0-LOG4).
//
// Parameters:
//   - topicCount: Number of topics (0-4 for LOG0-LOG4)
//   - dataSize: Size of the data being logged in bytes
//
// Returns:
//   - Gas cost for the LOG operation
func LogGasCost(topicCount uint8, dataSize uint64) uint64 {
	gas := LogGas                              // Base cost
	gas += uint64(topicCount) * LogTopicGas    // Cost per topic
	gas += dataSize * LogDataGas               // Cost per byte of data
	return gas
}

// CopyGasCost calculates the gas cost for copy operations (CODECOPY, RETURNDATACOPY, etc.).
// Many EVM operations copy data and charge per 32-byte word copied.
//
// Parameters:
//   - size: Number of bytes being copied
//
// Returns:
//   - Gas cost for copying the specified amount of data
func CopyGasCost(size uint64) uint64 {
	words := wordCount(size)
	return words * CopyGas
}

// CreateGasCost calculates the gas cost for CREATE operations based on init code size.
// Implements EIP-3860 init code size limits and per-word charging.
//
// Parameters:
//   - initCodeSize: Size of the initialization code in bytes
//
// Returns:
//   - Gas cost for the CREATE operation
func CreateGasCost(initCodeSize uint64) uint64 {
	words := wordCount(initCodeSize)
	return CreateGas + (words * InitcodeWordGas)
}

// CallGasCost calculates the gas cost for CALL operations with various conditions.
// Based on EIP-150 and EIP-2929 specifications.
//
// Parameters:
//   - valueTransfer: Whether the call transfers ETH value
//   - newAccount: Whether the target account is being created
//   - coldAccess: Whether this is a cold (first-time) account access
//
// Returns:
//   - Total gas cost for the CALL operation
func CallGasCost(valueTransfer, newAccount, coldAccess bool) uint64 {
	gas := CallGas

	if coldAccess {
		gas += ColdAccountAccessCost
	}

	if valueTransfer {
		gas += CallValueTransferGas
	}

	if newAccount {
		gas += CallNewAccountGas
	}

	return gas
}
