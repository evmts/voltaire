// Package primitives provides Ethereum primitive types and utilities.
//
// Hexadecimal utilities for Ethereum hex string processing and validation.
// All hex strings follow the Ethereum convention of "0x" prefix.
package primitives

import (
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
)

// Hex error types
var (
	ErrInvalidHexFormat    = errors.New("invalid hex format: missing 0x prefix")
	ErrInvalidHexLength    = errors.New("invalid hex length: must be even number of digits")
	ErrInvalidHexCharacter = errors.New("invalid hex character")
	ErrValueTooLarge       = errors.New("value too large for type")
)

// IsHex validates if a string is a valid hex string with "0x" prefix.
func IsHex(input string) bool {
	if len(input) < 3 {
		return false
	}
	if input[0:2] != "0x" {
		return false
	}

	for i := 2; i < len(input); i++ {
		c := input[i]
		valid := (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')
		if !valid {
			return false
		}
	}
	return true
}

// HexToBytes converts a hex string to bytes.
// The hex string must start with "0x" and have an even number of hex digits.
func HexToBytes(hexStr string) ([]byte, error) {
	if len(hexStr) < 2 || hexStr[0:2] != "0x" {
		return nil, ErrInvalidHexFormat
	}

	hexDigits := hexStr[2:]
	if len(hexDigits)%2 != 0 {
		return nil, ErrInvalidHexLength
	}

	bytes := make([]byte, len(hexDigits)/2)
	_, err := hex.Decode(bytes, []byte(hexDigits))
	if err != nil {
		return nil, ErrInvalidHexCharacter
	}

	return bytes, nil
}

// BytesToHex converts bytes to a hex string with "0x" prefix.
func BytesToHex(bytes []byte) string {
	if len(bytes) == 0 {
		return "0x"
	}
	return "0x" + hex.EncodeToString(bytes)
}

// HexToU256 converts a hex string to a U256 (big.Int).
func HexToU256(hexStr string) (*big.Int, error) {
	if len(hexStr) < 2 || hexStr[0:2] != "0x" {
		return nil, ErrInvalidHexFormat
	}

	hexDigits := hexStr[2:]
	if len(hexDigits) == 0 {
		return big.NewInt(0), nil
	}

	value := new(big.Int)
	_, success := value.SetString(hexDigits, 16)
	if !success {
		return nil, ErrInvalidHexCharacter
	}

	// Check if value exceeds U256 max (2^256 - 1)
	maxU256 := new(big.Int)
	maxU256.Exp(big.NewInt(2), big.NewInt(256), nil)
	maxU256.Sub(maxU256, big.NewInt(1))
	if value.Cmp(maxU256) > 0 {
		return nil, ErrValueTooLarge
	}

	return value, nil
}

// U256ToHex converts a U256 (big.Int) to a hex string with "0x" prefix.
func U256ToHex(value *big.Int) string {
	if value.Sign() == 0 {
		return "0x0"
	}
	return "0x" + value.Text(16)
}

// HexToU64 converts a hex string to uint64.
func HexToU64(hexStr string) (uint64, error) {
	value, err := HexToU256(hexStr)
	if err != nil {
		return 0, err
	}

	if !value.IsUint64() {
		return 0, ErrValueTooLarge
	}

	return value.Uint64(), nil
}

// U64ToHex converts uint64 to a hex string with "0x" prefix.
func U64ToHex(value uint64) string {
	return fmt.Sprintf("0x%x", value)
}

// PadLeft pads a byte slice to the target length with leading zeros.
func PadLeft(bytes []byte, targetLength int) []byte {
	if len(bytes) >= targetLength {
		return bytes
	}

	padded := make([]byte, targetLength)
	copy(padded[targetLength-len(bytes):], bytes)
	return padded
}

// PadRight pads a byte slice to the target length with trailing zeros.
func PadRight(bytes []byte, targetLength int) []byte {
	if len(bytes) >= targetLength {
		return bytes
	}

	padded := make([]byte, targetLength)
	copy(padded, bytes)
	return padded
}

// TrimLeftZeros removes leading zero bytes.
func TrimLeftZeros(bytes []byte) []byte {
	start := 0
	for start < len(bytes) && bytes[start] == 0 {
		start++
	}
	return bytes[start:]
}

// TrimRightZeros removes trailing zero bytes.
func TrimRightZeros(bytes []byte) []byte {
	end := len(bytes)
	for end > 0 && bytes[end-1] == 0 {
		end--
	}
	return bytes[0:end]
}

// Concat concatenates multiple byte slices.
func Concat(slices ...[]byte) []byte {
	totalLen := 0
	for _, slice := range slices {
		totalLen += len(slice)
	}

	result := make([]byte, totalLen)
	offset := 0
	for _, slice := range slices {
		copy(result[offset:], slice)
		offset += len(slice)
	}

	return result
}
