package rlp

import (
	"encoding/hex"
	"errors"
	"math/big"
)

// MaxDepth is the maximum nesting depth for RLP structures.
// Prevents stack overflow from malicious deeply nested data.
const MaxDepth = 32

// Errors returned by RLP functions.
var (
	ErrInputTooShort     = errors.New("rlp: input too short")
	ErrNonCanonical      = errors.New("rlp: non-canonical encoding")
	ErrLeadingZeros      = errors.New("rlp: leading zeros in length")
	ErrExtraBytes        = errors.New("rlp: extra bytes after valid RLP")
	ErrMaxDepthExceeded  = errors.New("rlp: max depth exceeded")
	ErrUnsupportedType   = errors.New("rlp: unsupported type")
	ErrNegativeInteger   = errors.New("rlp: negative integers not supported")
)

// Encode encodes a byte slice to RLP format.
func Encode(data []byte) ([]byte, error) {
	return encodeBytes(data), nil
}

// EncodeToHex encodes data to RLP and returns as hex string with 0x prefix.
func EncodeToHex(data []byte) (string, error) {
	encoded, err := Encode(data)
	if err != nil {
		return "", err
	}
	return "0x" + hex.EncodeToString(encoded), nil
}

// EncodeUint64 encodes a uint64 to RLP format.
// Zero is encoded as empty string (0x80).
func EncodeUint64(n uint64) ([]byte, error) {
	if n == 0 {
		return []byte{0x80}, nil
	}
	return encodeBytes(uint64ToBytes(n)), nil
}

// EncodeBigInt encodes a big.Int to RLP format.
// Zero is encoded as empty string (0x80).
// Negative integers return an error.
func EncodeBigInt(n *big.Int) ([]byte, error) {
	if n == nil || n.Sign() == 0 {
		return []byte{0x80}, nil
	}
	if n.Sign() < 0 {
		return nil, ErrNegativeInteger
	}
	return encodeBytes(n.Bytes()), nil
}

// EncodeList encodes a list of items to RLP format.
// Items can be []byte or []interface{} (nested lists).
func EncodeList(items []interface{}) ([]byte, error) {
	return encodeList(items, 0)
}

func encodeList(items []interface{}, depth int) ([]byte, error) {
	if depth > MaxDepth {
		return nil, ErrMaxDepthExceeded
	}

	// Encode each item and concatenate
	var payload []byte
	for _, item := range items {
		var encoded []byte
		var err error

		switch v := item.(type) {
		case []byte:
			encoded = encodeBytes(v)
		case []interface{}:
			encoded, err = encodeList(v, depth+1)
			if err != nil {
				return nil, err
			}
		case string:
			encoded = encodeBytes([]byte(v))
		case uint64:
			encoded, err = EncodeUint64(v)
			if err != nil {
				return nil, err
			}
		case *big.Int:
			encoded, err = EncodeBigInt(v)
			if err != nil {
				return nil, err
			}
		default:
			return nil, ErrUnsupportedType
		}

		payload = append(payload, encoded...)
	}

	return encodeListPayload(payload), nil
}

// encodeBytes encodes a byte slice according to RLP rules.
func encodeBytes(data []byte) []byte {
	length := len(data)

	// Single byte [0x00, 0x7f]: encoded as itself
	if length == 1 && data[0] < 0x80 {
		return []byte{data[0]}
	}

	// String 0-55 bytes: 0x80 + length, followed by data
	if length <= 55 {
		result := make([]byte, 1+length)
		result[0] = 0x80 + byte(length)
		copy(result[1:], data)
		return result
	}

	// String 56+ bytes: 0xb7 + len(length), length bytes, data
	lenBytes := uint64ToBytes(uint64(length))
	result := make([]byte, 1+len(lenBytes)+length)
	result[0] = 0xb7 + byte(len(lenBytes))
	copy(result[1:], lenBytes)
	copy(result[1+len(lenBytes):], data)
	return result
}

// encodeListPayload wraps encoded list items with list prefix.
func encodeListPayload(payload []byte) []byte {
	length := len(payload)

	// List 0-55 bytes: 0xc0 + length, followed by items
	if length <= 55 {
		result := make([]byte, 1+length)
		result[0] = 0xc0 + byte(length)
		copy(result[1:], payload)
		return result
	}

	// List 56+ bytes: 0xf7 + len(length), length bytes, items
	lenBytes := uint64ToBytes(uint64(length))
	result := make([]byte, 1+len(lenBytes)+length)
	result[0] = 0xf7 + byte(len(lenBytes))
	copy(result[1:], lenBytes)
	copy(result[1+len(lenBytes):], payload)
	return result
}

// DecodeBytes decodes RLP data to a dynamic type.
// Returns []byte for strings or []interface{} for lists.
func DecodeBytes(data []byte) (interface{}, error) {
	if len(data) == 0 {
		return nil, ErrInputTooShort
	}

	result, remainder, err := decode(data, 0)
	if err != nil {
		return nil, err
	}
	if len(remainder) > 0 {
		return nil, ErrExtraBytes
	}
	return result, nil
}

// DecodeWithRemainder decodes one RLP item and returns the remainder.
// Useful for streaming multiple RLP items.
func DecodeWithRemainder(data []byte) (interface{}, []byte, error) {
	if len(data) == 0 {
		return nil, nil, ErrInputTooShort
	}
	return decode(data, 0)
}

func decode(data []byte, depth int) (interface{}, []byte, error) {
	if len(data) == 0 {
		return nil, nil, ErrInputTooShort
	}

	if depth > MaxDepth {
		return nil, nil, ErrMaxDepthExceeded
	}

	prefix := data[0]

	// Single byte [0x00, 0x7f]
	if prefix < 0x80 {
		return data[:1], data[1:], nil
	}

	// String 0-55 bytes [0x80, 0xb7]
	if prefix <= 0xb7 {
		length := int(prefix - 0x80)
		if len(data) < 1+length {
			return nil, nil, ErrInputTooShort
		}

		// Empty string
		if length == 0 {
			return []byte{}, data[1:], nil
		}

		// Non-canonical: single byte < 0x80 should not have prefix
		if length == 1 && data[1] < 0x80 {
			return nil, nil, ErrNonCanonical
		}

		result := make([]byte, length)
		copy(result, data[1:1+length])
		return result, data[1+length:], nil
	}

	// String 56+ bytes [0xb8, 0xbf]
	if prefix <= 0xbf {
		lenLen := int(prefix - 0xb7)
		if len(data) < 1+lenLen {
			return nil, nil, ErrInputTooShort
		}

		// Check for leading zeros in length
		if data[1] == 0 {
			return nil, nil, ErrLeadingZeros
		}

		length := bytesToUint64(data[1 : 1+lenLen])

		// Non-canonical: length < 56 should use short form
		if length < 56 {
			return nil, nil, ErrNonCanonical
		}

		if len(data) < 1+lenLen+int(length) {
			return nil, nil, ErrInputTooShort
		}

		result := make([]byte, length)
		copy(result, data[1+lenLen:1+lenLen+int(length)])
		return result, data[1+lenLen+int(length):], nil
	}

	// List 0-55 bytes [0xc0, 0xf7]
	if prefix <= 0xf7 {
		length := int(prefix - 0xc0)
		if len(data) < 1+length {
			return nil, nil, ErrInputTooShort
		}

		// Decode list items
		items, err := decodeListItems(data[1:1+length], depth+1)
		if err != nil {
			return nil, nil, err
		}
		return items, data[1+length:], nil
	}

	// List 56+ bytes [0xf8, 0xff]
	lenLen := int(prefix - 0xf7)
	if len(data) < 1+lenLen {
		return nil, nil, ErrInputTooShort
	}

	// Check for leading zeros in length
	if data[1] == 0 {
		return nil, nil, ErrLeadingZeros
	}

	length := bytesToUint64(data[1 : 1+lenLen])

	// Non-canonical: length < 56 should use short form
	if length < 56 {
		return nil, nil, ErrNonCanonical
	}

	if len(data) < 1+lenLen+int(length) {
		return nil, nil, ErrInputTooShort
	}

	// Decode list items
	items, err := decodeListItems(data[1+lenLen:1+lenLen+int(length)], depth+1)
	if err != nil {
		return nil, nil, err
	}
	return items, data[1+lenLen+int(length):], nil
}

func decodeListItems(data []byte, depth int) ([]interface{}, error) {
	var items []interface{}
	for len(data) > 0 {
		item, remainder, err := decode(data, depth)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
		data = remainder
	}
	return items, nil
}

// IsValid returns true if data is valid RLP encoding.
func IsValid(data []byte) bool {
	_, err := DecodeBytes(data)
	return err == nil
}

// IsCanonical returns true if data uses canonical RLP encoding.
// Canonical means: minimal length encoding, no leading zeros.
func IsCanonical(data []byte) bool {
	return IsValid(data) // Our decoder rejects non-canonical
}

// uint64ToBytes converts uint64 to big-endian bytes with no leading zeros.
func uint64ToBytes(n uint64) []byte {
	if n == 0 {
		return nil
	}

	// Count bytes needed
	size := 0
	tmp := n
	for tmp > 0 {
		size++
		tmp >>= 8
	}

	result := make([]byte, size)
	for i := size - 1; i >= 0; i-- {
		result[i] = byte(n & 0xff)
		n >>= 8
	}
	return result
}

// bytesToUint64 converts big-endian bytes to uint64.
func bytesToUint64(data []byte) uint64 {
	var result uint64
	for _, b := range data {
		result = (result << 8) | uint64(b)
	}
	return result
}
