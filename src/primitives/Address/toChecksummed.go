package address

import (
	"encoding/hex"
	"strings"

	"golang.org/x/crypto/sha3"
)

func (a Address) ToChecksummed() string {
	lower := strings.ToLower(hex.EncodeToString(a[:]))

	hash := sha3.NewLegacyKeccak256()
	hash.Write([]byte(lower))
	hashBytes := hash.Sum(nil)
	hashHex := hex.EncodeToString(hashBytes)

	var result strings.Builder
	result.WriteString("0x")

	for i := 0; i < 40; i++ {
		ch := lower[i]
		if ch >= 'a' && ch <= 'f' {
			hv := hexCharToInt(hashHex[i])
			if hv >= 8 {
				result.WriteByte(ch - 32) // uppercase
			} else {
				result.WriteByte(ch)
			}
		} else {
			result.WriteByte(ch)
		}
	}

	return result.String()
}

func IsValidChecksum(s string) bool {
	if !IsValid(s) {
		return false
	}

	addr, err := FromHex(s)
	if err != nil {
		return false
	}

	checksummed := addr.ToChecksummed()
	if !strings.HasPrefix(s, "0x") {
		s = "0x" + s
	}

	return checksummed == s
}

func hexCharToInt(c byte) int {
	if c >= '0' && c <= '9' {
		return int(c - '0')
	}
	if c >= 'a' && c <= 'f' {
		return int(c - 'a' + 10)
	}
	if c >= 'A' && c <= 'F' {
		return int(c - 'A' + 10)
	}
	return 0
}
