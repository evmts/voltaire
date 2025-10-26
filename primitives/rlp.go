// Package primitives provides RLP (Recursive Length Prefix) encoding/decoding
// implementation for Ethereum.
//
// RLP is the main encoding method used to serialize objects in Ethereum.
// The specification is defined in the Ethereum Yellow Paper.
//
// Encoding Rules:
// - Single byte [0x00, 0x7f]: Encoded as itself
// - String [0-55 bytes]: [0x80 + length, data...]
// - String [56+ bytes]: [0xb7 + length_of_length, length..., data...]
// - List [0-55 bytes]: [0xc0 + length, items...]
// - List [56+ bytes]: [0xf7 + length_of_length, length..., items...]
package primitives

import (
	"errors"
	"fmt"
	"io"
	"math/big"
)

// RLP error types
var (
	ErrInputTooShort      = errors.New("RLP input data too short")
	ErrInputTooLong       = errors.New("RLP input data too long")
	ErrLeadingZeros       = errors.New("RLP invalid leading zeros in length")
	ErrNonCanonicalSize   = errors.New("RLP non-canonical size encoding")
	ErrInvalidLength      = errors.New("RLP invalid length")
	ErrUnexpectedInput    = errors.New("RLP unexpected input")
	ErrInvalidRemainder   = errors.New("RLP data has trailing bytes")
	ErrRecursionExceeded  = errors.New("RLP recursion depth exceeded")
)

// MaxRLPDepth is the maximum recursion depth to prevent stack overflow attacks
const MaxRLPDepth = 32

// RlpData represents decoded RLP data, which can be either a byte string or a list
type RlpData interface {
	isRlpData()
}

// RlpString represents a decoded byte string
type RlpString []byte

func (RlpString) isRlpData() {}

// RlpList represents a decoded list of RLP items
type RlpList []RlpData

func (RlpList) isRlpData() {}

// Encode encodes input data into RLP format.
// Supported types: []byte, string, *big.Int, uint64, []RlpData, [][]byte
func Encode(input interface{}) ([]byte, error) {
	switch v := input.(type) {
	case []byte:
		return encodeBytes(v), nil
	case string:
		return encodeBytes([]byte(v)), nil
	case *big.Int:
		if v == nil || v.Sign() == 0 {
			return []byte{0x80}, nil // Empty string for zero
		}
		return encodeBytes(v.Bytes()), nil
	case uint64:
		if v == 0 {
			return []byte{0x80}, nil // Empty string for zero
		}
		return encodeBytes(uint64ToBytes(v)), nil
	case []RlpData:
		return encodeList(v)
	case [][]byte:
		// Convert to RlpList
		list := make([]RlpData, len(v))
		for i, item := range v {
			list[i] = RlpString(item)
		}
		return encodeList(list)
	case RlpString:
		return encodeBytes(v), nil
	case RlpList:
		return encodeList(v)
	default:
		return nil, fmt.Errorf("unsupported type for RLP encoding: %T", input)
	}
}

// encodeBytes encodes a byte slice according to RLP string rules
func encodeBytes(data []byte) []byte {
	// Empty string
	if len(data) == 0 {
		return []byte{0x80}
	}

	// Single byte [0x00, 0x7f] - encoded as itself
	if len(data) == 1 && data[0] < 0x80 {
		return data
	}

	// Short string [1-55 bytes]
	if len(data) <= 55 {
		result := make([]byte, 1+len(data))
		result[0] = 0x80 + byte(len(data))
		copy(result[1:], data)
		return result
	}

	// Long string [56+ bytes]
	lengthBytes := encodeLengthBytes(len(data))
	result := make([]byte, 1+len(lengthBytes)+len(data))
	result[0] = 0xb7 + byte(len(lengthBytes))
	copy(result[1:], lengthBytes)
	copy(result[1+len(lengthBytes):], data)
	return result
}

// encodeLengthBytes encodes a length as big-endian bytes
func encodeLengthBytes(length int) []byte {
	if length == 0 {
		return []byte{}
	}

	var bytes []byte
	n := length
	for n > 0 {
		bytes = append([]byte{byte(n & 0xff)}, bytes...)
		n >>= 8
	}
	return bytes
}

// encodeList encodes a list of RLP items
func encodeList(items []RlpData) ([]byte, error) {
	// Encode all items
	var encodedItems [][]byte
	totalLength := 0
	for _, item := range items {
		var encoded []byte
		var err error
		switch v := item.(type) {
		case RlpString:
			encoded, err = Encode(v)
		case RlpList:
			encoded, err = Encode(v)
		default:
			encoded, err = Encode(item)
		}
		if err != nil {
			return nil, err
		}
		encodedItems = append(encodedItems, encoded)
		totalLength += len(encoded)
	}

	// Short list [0-55 bytes]
	if totalLength <= 55 {
		result := make([]byte, 1+totalLength)
		result[0] = 0xc0 + byte(totalLength)
		offset := 1
		for _, item := range encodedItems {
			copy(result[offset:], item)
			offset += len(item)
		}
		return result, nil
	}

	// Long list [56+ bytes]
	lengthBytes := encodeLengthBytes(totalLength)
	result := make([]byte, 1+len(lengthBytes)+totalLength)
	result[0] = 0xf7 + byte(len(lengthBytes))
	copy(result[1:], lengthBytes)
	offset := 1 + len(lengthBytes)
	for _, item := range encodedItems {
		copy(result[offset:], item)
		offset += len(item)
	}
	return result, nil
}

// Decode decodes RLP-encoded data
func Decode(data []byte) (RlpData, error) {
	result, remainder, err := decodeWithRemainder(data, 0)
	if err != nil {
		return nil, err
	}
	if len(remainder) > 0 {
		return nil, ErrInvalidRemainder
	}
	return result, nil
}

// DecodeStream decodes RLP-encoded data and returns the remainder
func DecodeStream(data []byte) (RlpData, []byte, error) {
	return decodeWithRemainder(data, 0)
}

// decodeWithRemainder decodes a single RLP item and returns it with remaining bytes
func decodeWithRemainder(data []byte, depth int) (RlpData, []byte, error) {
	if len(data) == 0 {
		return nil, nil, ErrInputTooShort
	}

	// Check recursion depth
	if depth >= MaxRLPDepth {
		return nil, nil, ErrRecursionExceeded
	}

	prefix := data[0]

	// Single byte [0x00, 0x7f]
	if prefix < 0x80 {
		return RlpString([]byte{prefix}), data[1:], nil
	}

	// Short string [0x80, 0xb7]
	if prefix <= 0xb7 {
		length := int(prefix - 0x80)

		// Check for non-canonical encoding
		if length == 1 && len(data) > 1 && data[1] < 0x80 {
			return nil, nil, ErrNonCanonicalSize
		}

		if len(data) < 1+length {
			return nil, nil, ErrInputTooShort
		}

		result := make([]byte, length)
		copy(result, data[1:1+length])
		return RlpString(result), data[1+length:], nil
	}

	// Long string [0xb8, 0xbf]
	if prefix <= 0xbf {
		lengthOfLength := int(prefix - 0xb7)

		if len(data) < 1+lengthOfLength {
			return nil, nil, ErrInputTooShort
		}

		// Check for leading zeros in length
		if data[1] == 0 {
			return nil, nil, ErrLeadingZeros
		}

		length := decodeLengthBytes(data[1 : 1+lengthOfLength])

		// Check for non-canonical size
		if length <= 55 {
			return nil, nil, ErrNonCanonicalSize
		}

		dataStart := 1 + lengthOfLength
		if len(data) < dataStart+length {
			return nil, nil, ErrInputTooShort
		}

		result := make([]byte, length)
		copy(result, data[dataStart:dataStart+length])
		return RlpString(result), data[dataStart+length:], nil
	}

	// Short list [0xc0, 0xf7]
	if prefix <= 0xf7 {
		length := int(prefix - 0xc0)

		if len(data) < 1+length {
			return nil, nil, ErrInputTooShort
		}

		items := []RlpData{}
		remaining := data[1 : 1+length]

		for len(remaining) > 0 {
			item, rem, err := decodeWithRemainder(remaining, depth+1)
			if err != nil {
				return nil, nil, err
			}
			items = append(items, item)
			remaining = rem
		}

		return RlpList(items), data[1+length:], nil
	}

	// Long list [0xf8, 0xff]
	lengthOfLength := int(prefix - 0xf7)

	if len(data) < 1+lengthOfLength {
		return nil, nil, ErrInputTooShort
	}

	// Check for leading zeros in length
	if data[1] == 0 {
		return nil, nil, ErrLeadingZeros
	}

	length := decodeLengthBytes(data[1 : 1+lengthOfLength])

	// Check for non-canonical size
	if length <= 55 {
		return nil, nil, ErrNonCanonicalSize
	}

	listStart := 1 + lengthOfLength
	if len(data) < listStart+length {
		return nil, nil, ErrInputTooShort
	}

	items := []RlpData{}
	remaining := data[listStart : listStart+length]

	for len(remaining) > 0 {
		item, rem, err := decodeWithRemainder(remaining, depth+1)
		if err != nil {
			return nil, nil, err
		}
		items = append(items, item)
		remaining = rem
	}

	return RlpList(items), data[listStart+length:], nil
}

// decodeLengthBytes decodes a big-endian length value
func decodeLengthBytes(bytes []byte) int {
	length := 0
	for _, b := range bytes {
		length = (length << 8) | int(b)
	}
	return length
}

// uint64ToBytes converts a uint64 to big-endian bytes (no leading zeros)
func uint64ToBytes(n uint64) []byte {
	if n == 0 {
		return []byte{}
	}

	var bytes []byte
	for n > 0 {
		bytes = append([]byte{byte(n & 0xff)}, bytes...)
		n >>= 8
	}
	return bytes
}

// EncodeToWriter encodes data and writes to an io.Writer
func EncodeToWriter(w io.Writer, input interface{}) error {
	encoded, err := Encode(input)
	if err != nil {
		return err
	}
	_, err = w.Write(encoded)
	return err
}

// IsValidRlpEncoding checks if data is valid RLP encoding
func IsValidRlpEncoding(data []byte) bool {
	_, err := Decode(data)
	return err == nil
}
