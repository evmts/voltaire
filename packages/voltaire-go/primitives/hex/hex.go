// Package hex provides hex encoding utilities.
package hex

import (
	"github.com/voltaire-labs/voltaire-go/internal/ffi"
)

// Decode decodes a hex string to bytes.
// Accepts both "0x" prefixed and raw hex strings.
func Decode(s string) ([]byte, error) {
	return ffi.HexToBytes(s)
}

// Encode encodes bytes to a hex string with 0x prefix.
func Encode(data []byte) string {
	return ffi.BytesToHex(data)
}

// MustDecode decodes a hex string, panicking on error.
func MustDecode(s string) []byte {
	b, err := Decode(s)
	if err != nil {
		panic("hex.MustDecode: " + err.Error())
	}
	return b
}

// HasPrefix returns true if the string has a 0x prefix.
func HasPrefix(s string) bool {
	return len(s) >= 2 && s[0] == '0' && (s[1] == 'x' || s[1] == 'X')
}

// TrimPrefix removes the 0x prefix if present.
func TrimPrefix(s string) string {
	if HasPrefix(s) {
		return s[2:]
	}
	return s
}

// AddPrefix adds the 0x prefix if not present.
func AddPrefix(s string) string {
	if HasPrefix(s) {
		return s
	}
	return "0x" + s
}
