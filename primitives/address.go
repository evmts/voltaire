package primitives

import (
	"errors"
	"fmt"
	"math/big"
	"strings"

	"golang.org/x/crypto/sha3"
)

// Address represents an Ethereum address (20 bytes).
type Address [20]byte

var (
	// ZeroAddress is the zero address (0x0000...0000)
	ZeroAddress = Address{}

	// Address errors
	ErrInvalidAddressLength = errors.New("invalid address length: must be 20 bytes")
	ErrInvalidAddressFormat = errors.New("invalid address format")
)

// FromHex creates an Address from a hex string (with 0x prefix).
// The hex string must be exactly 42 characters (0x + 40 hex digits).
func AddressFromHex(hexStr string) (Address, error) {
	if len(hexStr) != 42 || hexStr[0:2] != "0x" {
		return Address{}, ErrInvalidAddressFormat
	}

	bytes, err := HexToBytes(hexStr)
	if err != nil {
		return Address{}, err
	}

	if len(bytes) != 20 {
		return Address{}, ErrInvalidAddressLength
	}

	var addr Address
	copy(addr[:], bytes)
	return addr, nil
}

// FromBytes creates an Address from a byte slice.
func AddressFromBytes(bytes []byte) (Address, error) {
	if len(bytes) != 20 {
		return Address{}, ErrInvalidAddressLength
	}

	var addr Address
	copy(addr[:], bytes)
	return addr, nil
}

// FromPublicKey derives an Address from an uncompressed public key (x, y coordinates).
func AddressFromPublicKey(publicKeyX, publicKeyY *big.Int) Address {
	// Concatenate x and y coordinates (64 bytes total)
	pubKeyBytes := make([]byte, 64)

	// Write x coordinate (big-endian)
	xBytes := publicKeyX.Bytes()
	copy(pubKeyBytes[32-len(xBytes):32], xBytes)

	// Write y coordinate (big-endian)
	yBytes := publicKeyY.Bytes()
	copy(pubKeyBytes[64-len(yBytes):64], yBytes)

	// Hash and take last 20 bytes
	hash := Keccak256(pubKeyBytes)
	var addr Address
	copy(addr[:], hash[12:32])

	return addr
}

// FromU256 creates an Address from a U256 value (uses last 20 bytes).
func AddressFromU256(value *big.Int) Address {
	var addr Address
	bytes := value.Bytes()

	// If value is less than 20 bytes, pad with leading zeros
	if len(bytes) <= 20 {
		copy(addr[20-len(bytes):], bytes)
	} else {
		// If value is more than 20 bytes, take the last 20 bytes
		copy(addr[:], bytes[len(bytes)-20:])
	}

	return addr
}

// ToHex converts the Address to a hex string (lowercase, with 0x prefix).
func (a Address) ToHex() string {
	return BytesToHex(a[:])
}

// ToChecksumHex converts the Address to an EIP-55 checksummed hex string.
func (a Address) ToChecksumHex() string {
	// Convert to lowercase hex without prefix
	hex := strings.ToLower(fmt.Sprintf("%x", a[:]))

	// Hash the lowercase hex
	hash := sha3.NewLegacyKeccak256()
	hash.Write([]byte(hex))
	hashBytes := hash.Sum(nil)

	// Build checksummed string
	result := make([]byte, 42)
	result[0] = '0'
	result[1] = 'x'

	for i := 0; i < 40; i++ {
		char := hex[i]
		if char >= 'a' && char <= 'f' {
			// Check if this hex digit should be uppercase
			hashByte := hashBytes[i/2]
			var nibble byte
			if i%2 == 0 {
				nibble = hashByte >> 4
			} else {
				nibble = hashByte & 0x0f
			}

			if nibble >= 8 {
				char = char - 'a' + 'A'
			}
		}
		result[2+i] = char
	}

	return string(result)
}

// IsZero returns true if the address is the zero address.
func (a Address) IsZero() bool {
	return a == ZeroAddress
}

// Equals returns true if two addresses are equal.
func (a Address) Equals(other Address) bool {
	return a == other
}

// ToU256 converts the Address to a U256 (big.Int).
func (a Address) ToU256() *big.Int {
	return new(big.Int).SetBytes(a[:])
}

// Bytes returns the address as a byte slice.
func (a Address) Bytes() []byte {
	return a[:]
}

// String returns the checksummed hex representation of the address.
func (a Address) String() string {
	return a.ToChecksumHex()
}

// ValidateChecksum validates an EIP-55 checksummed address.
func ValidateChecksum(hexStr string) bool {
	addr, err := AddressFromHex(hexStr)
	if err != nil {
		return false
	}

	return addr.ToChecksumHex() == hexStr
}

// IsValidAddress checks if a string is a valid address format (hex validation only).
func IsValidAddress(addrStr string) bool {
	if len(addrStr) != 42 || addrStr[0:2] != "0x" {
		return false
	}

	for i := 2; i < len(addrStr); i++ {
		c := addrStr[i]
		valid := (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')
		if !valid {
			return false
		}
	}

	return true
}

// CalculateCreateAddress calculates the CREATE contract address.
// addr = keccak256(rlp([sender, nonce]))[12:]
func CalculateCreateAddress(sender Address, nonce uint64) (Address, error) {
	// Simple RLP encoding for [address, nonce]
	// This is a simplified implementation - in production, use a full RLP library
	rlpEncoded := encodeCreateRLP(sender[:], nonce)

	hash := Keccak256(rlpEncoded)
	var addr Address
	copy(addr[:], hash[12:32])

	return addr, nil
}

// CalculateCreate2Address calculates the CREATE2 contract address.
// addr = keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:]
func CalculateCreate2Address(sender Address, salt [32]byte, initCodeHash [32]byte) Address {
	// Build: 0xff ++ sender (20 bytes) ++ salt (32 bytes) ++ initCodeHash (32 bytes)
	data := make([]byte, 1+20+32+32)
	data[0] = 0xff
	copy(data[1:21], sender[:])
	copy(data[21:53], salt[:])
	copy(data[53:85], initCodeHash[:])

	hash := Keccak256(data)
	var addr Address
	copy(addr[:], hash[12:32])

	return addr
}

// Keccak256 computes the Keccak-256 hash of data.
func Keccak256(data []byte) []byte {
	hash := sha3.NewLegacyKeccak256()
	hash.Write(data)
	return hash.Sum(nil)
}

// encodeCreateRLP is a simplified RLP encoding for CREATE address calculation.
// This encodes [address_bytes, nonce] according to RLP rules.
func encodeCreateRLP(address []byte, nonce uint64) []byte {
	// Encode address (20 bytes) - string encoding
	addressRLP := encodeRLPBytes(address)

	// Encode nonce - integer encoding
	var nonceRLP []byte
	if nonce == 0 {
		nonceRLP = []byte{0x80} // Empty byte array
	} else if nonce < 0x80 {
		nonceRLP = []byte{byte(nonce)}
	} else {
		// Encode as byte array (minimal bytes)
		nonceBytes := encodeMinimalBytes(nonce)
		nonceRLP = encodeRLPBytes(nonceBytes)
	}

	// Combine into list
	payload := append(addressRLP, nonceRLP...)
	return encodeRLPList(payload)
}

// encodeRLPBytes encodes bytes according to RLP rules.
func encodeRLPBytes(data []byte) []byte {
	if len(data) == 1 && data[0] < 0x80 {
		return data
	}
	if len(data) <= 55 {
		return append([]byte{byte(0x80 + len(data))}, data...)
	}
	lenBytes := encodeMinimalBytes(uint64(len(data)))
	prefix := byte(0xb7 + len(lenBytes))
	result := append([]byte{prefix}, lenBytes...)
	return append(result, data...)
}

// encodeRLPList encodes a list payload according to RLP rules.
func encodeRLPList(payload []byte) []byte {
	if len(payload) <= 55 {
		return append([]byte{byte(0xc0 + len(payload))}, payload...)
	}
	lenBytes := encodeMinimalBytes(uint64(len(payload)))
	prefix := byte(0xf7 + len(lenBytes))
	result := append([]byte{prefix}, lenBytes...)
	return append(result, payload...)
}

// encodeMinimalBytes encodes a uint64 as minimal big-endian bytes.
func encodeMinimalBytes(value uint64) []byte {
	if value == 0 {
		return []byte{}
	}

	// Determine how many bytes we need
	var buf [8]byte
	var i int
	for i = 7; i >= 0; i-- {
		buf[i] = byte(value & 0xff)
		value >>= 8
		if value == 0 {
			break
		}
	}

	return buf[i:]
}

// constantTimeCompare performs constant-time comparison of byte slices.
func constantTimeCompare(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	var result byte
	for i := 0; i < len(a); i++ {
		result |= a[i] ^ b[i]
	}
	return result == 0
}
