package address

import (
	"bytes"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"strings"
)

const (
	Size    = 20
	HexSize = 42
)

var (
	ErrInvalidHexFormat      = errors.New("invalid hex format for address")
	ErrInvalidHexString      = errors.New("invalid hex string")
	ErrInvalidAddressLength  = errors.New("invalid address length")
	ErrInvalidValue          = errors.New("invalid value")
	ErrNotImplemented        = errors.New("not implemented")
)

type Address [Size]byte

func From(value interface{}) (Address, error) {
	switch v := value.(type) {
	case int:
		return FromNumber(big.NewInt(int64(v)))
	case int64:
		return FromNumber(big.NewInt(v))
	case uint64:
		return FromNumber(new(big.Int).SetUint64(v))
	case *big.Int:
		return FromNumber(v)
	case string:
		return FromHex(v)
	case []byte:
		return FromBytes(v)
	case Address:
		return v, nil
	case [Size]byte:
		return Address(v), nil
	default:
		return Address{}, fmt.Errorf("%w: unsupported address value type", ErrInvalidValue)
	}
}

func FromHex(s string) (Address, error) {
	if !strings.HasPrefix(s, "0x") || len(s) != HexSize {
		return Address{}, ErrInvalidHexFormat
	}

	hexPart := s[2:]
	if !isValidHexString(hexPart) {
		return Address{}, ErrInvalidHexString
	}

	b, err := hex.DecodeString(hexPart)
	if err != nil {
		return Address{}, ErrInvalidHexString
	}

	var addr Address
	copy(addr[:], b)
	return addr, nil
}

func FromBytes(b []byte) (Address, error) {
	if len(b) != Size {
		return Address{}, ErrInvalidAddressLength
	}

	var addr Address
	copy(addr[:], b)
	return addr, nil
}

func FromNumber(n *big.Int) (Address, error) {
	if n.Sign() < 0 {
		return Address{}, fmt.Errorf("%w: address value cannot be negative", ErrInvalidValue)
	}

	var addr Address
	mask := new(big.Int).Lsh(big.NewInt(1), 160)
	mask.Sub(mask, big.NewInt(1))
	v := new(big.Int).And(n, mask)

	b := v.Bytes()
	if len(b) > Size {
		copy(addr[:], b[len(b)-Size:])
	} else {
		copy(addr[Size-len(b):], b)
	}

	return addr, nil
}

func (a Address) ToHex() string {
	return "0x" + hex.EncodeToString(a[:])
}

func (a Address) ToBytes() []byte {
	b := make([]byte, Size)
	copy(b, a[:])
	return b
}

func (a Address) Equals(other Address) bool {
	return bytes.Equal(a[:], other[:])
}

func (a Address) Compare(other Address) int {
	return bytes.Compare(a[:], other[:])
}

func (a Address) LessThan(other Address) bool {
	return a.Compare(other) < 0
}

func (a Address) GreaterThan(other Address) bool {
	return a.Compare(other) > 0
}

func (a Address) IsZero() bool {
	for _, b := range a {
		if b != 0 {
			return false
		}
	}
	return true
}

func (a Address) String() string {
	return a.ToHex()
}

func IsValid(s string) bool {
	if !strings.HasPrefix(s, "0x") {
		return len(s) == 40 && isValidHexString(s)
	}
	return len(s) == HexSize && isValidHexString(s[2:])
}

func isValidHexString(s string) bool {
	for _, c := range s {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}
	return true
}

func Zero() Address {
	return Address{}
}
