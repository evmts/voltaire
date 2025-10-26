// Package primitives provides ABI (Application Binary Interface) encoding/decoding
// implementation for Ethereum smart contract interaction.
//
// ABI encoding is used for:
// - Function call encoding
// - Event log encoding
// - Contract deployment parameters
//
// Encoding follows the Ethereum Contract ABI specification with 32-byte alignment.
package primitives

import (
	"errors"
	"fmt"
	"math/big"
	"strings"

	"golang.org/x/crypto/sha3"
)

// ABI error types
var (
	ErrInvalidAbiType      = errors.New("invalid ABI type")
	ErrInvalidAbiData      = errors.New("invalid ABI data")
	ErrInvalidAbiLength    = errors.New("invalid ABI data length")
	ErrInvalidAddress      = errors.New("invalid Ethereum address")
	ErrInvalidSelector     = errors.New("invalid function selector")
	ErrParameterMismatch   = errors.New("parameter count mismatch")
	ErrUnsupportedType     = errors.New("unsupported ABI type")
)

// AbiType represents Ethereum ABI types
type AbiType string

const (
	TypeUint8     AbiType = "uint8"
	TypeUint16    AbiType = "uint16"
	TypeUint32    AbiType = "uint32"
	TypeUint64    AbiType = "uint64"
	TypeUint128   AbiType = "uint128"
	TypeUint256   AbiType = "uint256"
	TypeInt8      AbiType = "int8"
	TypeInt16     AbiType = "int16"
	TypeInt32     AbiType = "int32"
	TypeInt64     AbiType = "int64"
	TypeInt128    AbiType = "int128"
	TypeInt256    AbiType = "int256"
	TypeAddress   AbiType = "address"
	TypeBool      AbiType = "bool"
	TypeBytes     AbiType = "bytes"
	TypeString    AbiType = "string"
	TypeBytes32   AbiType = "bytes32"
	// Array types
	TypeUint256Array AbiType = "uint256[]"
	TypeBytes32Array AbiType = "bytes32[]"
	TypeAddressArray AbiType = "address[]"
	TypeStringArray  AbiType = "string[]"
)

// AbiParameter represents a function parameter
type AbiParameter struct {
	Name    string
	Type    AbiType
	Indexed bool // For events
}

// FunctionDefinition represents a smart contract function
type FunctionDefinition struct {
	Name    string
	Inputs  []AbiParameter
	Outputs []AbiParameter
}

// AbiValue represents a value that can be ABI encoded
type AbiValue interface{}

// Selector is a 4-byte function selector
type Selector [4]byte

// isDynamicType checks if a type requires dynamic encoding
func isDynamicType(t AbiType) bool {
	return t == TypeBytes || t == TypeString || strings.HasSuffix(string(t), "[]")
}

// EncodeAbiParameters encodes function parameters according to ABI specification
func EncodeAbiParameters(params []AbiParameter, values []AbiValue) ([]byte, error) {
	if len(params) != len(values) {
		return nil, ErrParameterMismatch
	}

	if len(params) == 0 {
		return []byte{}, nil
	}

	// Separate static and dynamic parts
	staticParts := make([][]byte, len(params))
	dynamicParts := make([][]byte, len(params))

	for i := range params {
		if isDynamicType(params[i].Type) {
			// Dynamic type: encode offset placeholder
			staticParts[i] = make([]byte, 32)
			encoded, err := encodeValue(params[i].Type, values[i])
			if err != nil {
				return nil, err
			}
			dynamicParts[i] = encoded
		} else {
			// Static type: encode directly
			encoded, err := encodeValue(params[i].Type, values[i])
			if err != nil {
				return nil, err
			}
			staticParts[i] = encoded
			dynamicParts[i] = []byte{}
		}
	}

	// Calculate offsets for dynamic parts
	staticLength := 0
	for _, part := range staticParts {
		staticLength += len(part)
	}

	dynamicOffset := staticLength
	for i := range params {
		if isDynamicType(params[i].Type) {
			// Update offset placeholder
			encodeBigIntToBytes(big.NewInt(int64(dynamicOffset)), staticParts[i])
			dynamicOffset += len(dynamicParts[i])
		}
	}

	// Concatenate all parts
	result := []byte{}
	for _, part := range staticParts {
		result = append(result, part...)
	}
	for _, part := range dynamicParts {
		result = append(result, part...)
	}

	return result, nil
}

// DecodeAbiParameters decodes ABI-encoded parameters
func DecodeAbiParameters(params []AbiParameter, data []byte) ([]AbiValue, error) {
	result := make([]AbiValue, len(params))
	offset := 0

	for i, param := range params {
		if isDynamicType(param.Type) {
			// Dynamic type: read offset, then decode from that position
			if offset+32 > len(data) {
				return nil, ErrInvalidAbiLength
			}
			dynamicOffset := int(new(big.Int).SetBytes(data[offset : offset+32]).Int64())
			value, err := decodeValue(param.Type, data, dynamicOffset)
			if err != nil {
				return nil, err
			}
			result[i] = value
			offset += 32
		} else {
			// Static type: decode directly
			value, newOffset, err := decodeValueWithOffset(param.Type, data, offset)
			if err != nil {
				return nil, err
			}
			result[i] = value
			offset = newOffset
		}
	}

	return result, nil
}

// encodeValue encodes a single value
func encodeValue(t AbiType, value AbiValue) ([]byte, error) {
	// Handle arrays
	if strings.HasSuffix(string(t), "[]") {
		arr, ok := value.([]AbiValue)
		if !ok {
			return nil, ErrInvalidAbiData
		}

		elementType := AbiType(strings.TrimSuffix(string(t), "[]"))

		// Encode length
		lengthBytes := make([]byte, 32)
		encodeBigIntToBytes(big.NewInt(int64(len(arr))), lengthBytes)

		result := lengthBytes

		// Encode each element
		for _, elem := range arr {
			encoded, err := encodeValue(elementType, elem)
			if err != nil {
				return nil, err
			}
			result = append(result, encoded...)
		}

		return result, nil
	}

	// Handle numeric types
	if strings.HasPrefix(string(t), "uint") || strings.HasPrefix(string(t), "int") {
		var num *big.Int
		switch v := value.(type) {
		case *big.Int:
			num = v
		case int64:
			num = big.NewInt(v)
		case uint64:
			num = new(big.Int).SetUint64(v)
		case int:
			num = big.NewInt(int64(v))
		case uint:
			num = new(big.Int).SetUint64(uint64(v))
		default:
			return nil, ErrInvalidAbiData
		}

		result := make([]byte, 32)
		encodeBigIntToBytes(num, result)
		return result, nil
	}

	// Handle bool
	if t == TypeBool {
		result := make([]byte, 32)
		if value.(bool) {
			result[31] = 1
		}
		return result, nil
	}

	// Handle address
	if t == TypeAddress {
		addr, ok := value.(string)
		if !ok {
			return nil, ErrInvalidAddress
		}

		// Remove 0x prefix if present
		if strings.HasPrefix(addr, "0x") {
			addr = addr[2:]
		}

		if len(addr) != 40 {
			return nil, ErrInvalidAddress
		}

		addrBytes := hexToBytes(addr)
		result := make([]byte, 32)
		copy(result[12:], addrBytes)
		return result, nil
	}

	// Handle bytes32 and fixed bytes
	if strings.HasPrefix(string(t), "bytes") && !strings.HasSuffix(string(t), "[]") && t != TypeBytes {
		bytes, ok := value.([]byte)
		if !ok {
			return nil, ErrInvalidAbiData
		}

		result := make([]byte, 32)
		copy(result, bytes)
		return result, nil
	}

	// Handle dynamic bytes
	if t == TypeBytes {
		bytes, ok := value.([]byte)
		if !ok {
			return nil, ErrInvalidAbiData
		}

		// Encode length
		lengthBytes := make([]byte, 32)
		encodeBigIntToBytes(big.NewInt(int64(len(bytes))), lengthBytes)

		// Pad data to 32-byte boundary
		paddedData := padRight(bytes, ((len(bytes)+31)/32)*32)

		result := append(lengthBytes, paddedData...)
		return result, nil
	}

	// Handle string
	if t == TypeString {
		str, ok := value.(string)
		if !ok {
			return nil, ErrInvalidAbiData
		}

		bytes := []byte(str)

		// Encode length
		lengthBytes := make([]byte, 32)
		encodeBigIntToBytes(big.NewInt(int64(len(bytes))), lengthBytes)

		// Pad data to 32-byte boundary
		paddedData := padRight(bytes, ((len(bytes)+31)/32)*32)

		result := append(lengthBytes, paddedData...)
		return result, nil
	}

	return nil, ErrUnsupportedType
}

// decodeValue decodes a value at a specific offset
func decodeValue(t AbiType, data []byte, offset int) (AbiValue, error) {
	value, _, err := decodeValueWithOffset(t, data, offset)
	return value, err
}

// decodeValueWithOffset decodes a value and returns the new offset
func decodeValueWithOffset(t AbiType, data []byte, offset int) (AbiValue, int, error) {
	// Handle numeric types
	if strings.HasPrefix(string(t), "uint") || strings.HasPrefix(string(t), "int") {
		if offset+32 > len(data) {
			return nil, 0, ErrInvalidAbiLength
		}
		value := new(big.Int).SetBytes(data[offset : offset+32])
		return value, offset + 32, nil
	}

	// Handle bool
	if t == TypeBool {
		if offset+32 > len(data) {
			return nil, 0, ErrInvalidAbiLength
		}
		value := new(big.Int).SetBytes(data[offset:offset+32]).Cmp(big.NewInt(0)) != 0
		return value, offset + 32, nil
	}

	// Handle address
	if t == TypeAddress {
		if offset+32 > len(data) {
			return nil, 0, ErrInvalidAbiLength
		}
		addrBytes := data[offset+12 : offset+32]
		addr := "0x" + bytesToHex(addrBytes)
		return addr, offset + 32, nil
	}

	// Handle bytes32 and fixed bytes
	if strings.HasPrefix(string(t), "bytes") && !strings.HasSuffix(string(t), "[]") && t != TypeBytes {
		if offset+32 > len(data) {
			return nil, 0, ErrInvalidAbiLength
		}
		// Extract actual size from type name
		var size int
		if t == TypeBytes32 {
			size = 32
		} else {
			fmt.Sscanf(string(t), "bytes%d", &size)
		}
		value := make([]byte, size)
		copy(value, data[offset:offset+size])
		return value, offset + 32, nil
	}

	// Handle dynamic bytes
	if t == TypeBytes {
		if offset+32 > len(data) {
			return nil, 0, ErrInvalidAbiLength
		}
		length := int(new(big.Int).SetBytes(data[offset : offset+32]).Int64())
		if offset+32+length > len(data) {
			return nil, 0, ErrInvalidAbiLength
		}
		value := make([]byte, length)
		copy(value, data[offset+32:offset+32+length])
		paddedLength := ((length + 31) / 32) * 32
		return value, offset + 32 + paddedLength, nil
	}

	// Handle string
	if t == TypeString {
		if offset+32 > len(data) {
			return nil, 0, ErrInvalidAbiLength
		}
		length := int(new(big.Int).SetBytes(data[offset : offset+32]).Int64())
		if offset+32+length > len(data) {
			return nil, 0, ErrInvalidAbiLength
		}
		value := string(data[offset+32 : offset+32+length])
		paddedLength := ((length + 31) / 32) * 32
		return value, offset + 32 + paddedLength, nil
	}

	// Handle arrays
	if strings.HasSuffix(string(t), "[]") {
		if offset+32 > len(data) {
			return nil, 0, ErrInvalidAbiLength
		}
		length := int(new(big.Int).SetBytes(data[offset : offset+32]).Int64())
		elementType := AbiType(strings.TrimSuffix(string(t), "[]"))

		result := make([]AbiValue, length)
		currentOffset := offset + 32

		for i := 0; i < length; i++ {
			value, newOffset, err := decodeValueWithOffset(elementType, data, currentOffset)
			if err != nil {
				return nil, 0, err
			}
			result[i] = value
			currentOffset = newOffset
		}

		return result, currentOffset, nil
	}

	return nil, 0, ErrUnsupportedType
}

// ComputeSelector computes the 4-byte function selector from a signature
func ComputeSelector(signature string) Selector {
	hash := sha3.NewLegacyKeccak256()
	hash.Write([]byte(signature))
	hashBytes := hash.Sum(nil)

	var selector Selector
	copy(selector[:], hashBytes[:4])
	return selector
}

// CreateFunctionSignature creates a function signature from a definition
func CreateFunctionSignature(def FunctionDefinition) string {
	types := make([]string, len(def.Inputs))
	for i, input := range def.Inputs {
		types[i] = string(input.Type)
	}
	return fmt.Sprintf("%s(%s)", def.Name, strings.Join(types, ","))
}

// EncodeFunctionData encodes function call data (selector + encoded args)
func EncodeFunctionData(def FunctionDefinition, args []AbiValue) ([]byte, error) {
	signature := CreateFunctionSignature(def)
	selector := ComputeSelector(signature)

	encodedArgs, err := EncodeAbiParameters(def.Inputs, args)
	if err != nil {
		return nil, err
	}

	result := append(selector[:], encodedArgs...)
	return result, nil
}

// DecodeFunctionData decodes function call data
func DecodeFunctionData(def FunctionDefinition, data []byte) ([]AbiValue, error) {
	if len(data) < 4 {
		return nil, ErrInvalidSelector
	}

	// Skip selector (first 4 bytes)
	encodedArgs := data[4:]
	return DecodeAbiParameters(def.Inputs, encodedArgs)
}

// EncodeEventTopics encodes event topics for indexed parameters
func EncodeEventTopics(def FunctionDefinition, values []AbiValue) ([][]byte, error) {
	signature := CreateFunctionSignature(def)
	hash := sha3.NewLegacyKeccak256()
	hash.Write([]byte(signature))
	signatureHash := hash.Sum(nil)

	topics := [][]byte{signatureHash}

	// Add indexed parameters
	indexedIdx := 0
	for _, param := range def.Inputs {
		if param.Indexed {
			if indexedIdx >= len(values) {
				break
			}
			encoded, err := encodeValue(param.Type, values[indexedIdx])
			if err != nil {
				return nil, err
			}

			// For dynamic types, hash the encoded value
			if isDynamicType(param.Type) {
				hash := sha3.NewLegacyKeccak256()
				hash.Write(encoded)
				topics = append(topics, hash.Sum(nil))
			} else {
				topics = append(topics, encoded)
			}
			indexedIdx++
		}
	}

	return topics, nil
}

// EncodePacked encodes data with no padding (non-standard, used for hashing)
func EncodePacked(params []AbiParameter, values []AbiValue) ([]byte, error) {
	if len(params) != len(values) {
		return nil, ErrParameterMismatch
	}

	result := []byte{}

	for i, param := range params {
		value := values[i]

		if strings.HasPrefix(string(param.Type), "uint") || strings.HasPrefix(string(param.Type), "int") {
			// Extract bit size
			var bitSize int
			fmt.Sscanf(string(param.Type), "uint%d", &bitSize)
			if bitSize == 0 {
				fmt.Sscanf(string(param.Type), "int%d", &bitSize)
			}
			if bitSize == 0 {
				bitSize = 256
			}
			byteSize := bitSize / 8

			var num *big.Int
			switch v := value.(type) {
			case *big.Int:
				num = v
			case int64:
				num = big.NewInt(v)
			case uint64:
				num = new(big.Int).SetUint64(v)
			case int:
				num = big.NewInt(int64(v))
			default:
				return nil, ErrInvalidAbiData
			}

			bytes := num.Bytes()
			// Pad to exact byte size
			if len(bytes) < byteSize {
				padded := make([]byte, byteSize)
				copy(padded[byteSize-len(bytes):], bytes)
				bytes = padded
			}
			result = append(result, bytes...)
		} else if param.Type == TypeAddress {
			addr, ok := value.(string)
			if !ok {
				return nil, ErrInvalidAddress
			}
			if strings.HasPrefix(addr, "0x") {
				addr = addr[2:]
			}
			addrBytes := hexToBytes(addr)
			result = append(result, addrBytes...)
		} else if param.Type == TypeBool {
			if value.(bool) {
				result = append(result, 1)
			} else {
				result = append(result, 0)
			}
		} else if param.Type == TypeString {
			str, ok := value.(string)
			if !ok {
				return nil, ErrInvalidAbiData
			}
			result = append(result, []byte(str)...)
		} else if param.Type == TypeBytes {
			bytes, ok := value.([]byte)
			if !ok {
				return nil, ErrInvalidAbiData
			}
			result = append(result, bytes...)
		} else if strings.HasPrefix(string(param.Type), "bytes") {
			bytes, ok := value.([]byte)
			if !ok {
				return nil, ErrInvalidAbiData
			}
			result = append(result, bytes...)
		}
	}

	return result, nil
}

// Helper functions

func encodeBigIntToBytes(value *big.Int, dest []byte) {
	bytes := value.Bytes()
	// Pad left with zeros
	copy(dest[32-len(bytes):], bytes)
}

func padRight(data []byte, length int) []byte {
	if len(data) >= length {
		return data
	}
	result := make([]byte, length)
	copy(result, data)
	return result
}

func hexToBytes(s string) []byte {
	result := make([]byte, len(s)/2)
	for i := 0; i < len(s); i += 2 {
		var b byte
		fmt.Sscanf(s[i:i+2], "%02x", &b)
		result[i/2] = b
	}
	return result
}

func bytesToHex(bytes []byte) string {
	result := ""
	for _, b := range bytes {
		result += fmt.Sprintf("%02x", b)
	}
	return result
}

// EstimateGasForData estimates gas cost for calldata
func EstimateGasForData(data []byte) uint64 {
	var gas uint64
	for _, b := range data {
		if b == 0 {
			gas += 4 // Zero byte cost
		} else {
			gas += 16 // Non-zero byte cost
		}
	}
	return gas
}
