package keccak256

import (
	"testing"
)

func TestHash(t *testing.T) {
	// Empty string: keccak256("") = c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
	emptyHash := Hash([]byte{})
	want := "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
	if emptyHash.Hex() != want {
		t.Errorf("Hash([]) = %s, want %s", emptyHash.Hex(), want)
	}
}

func TestHashString(t *testing.T) {
	// keccak256("hello") = 1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8
	h := HashString("hello")
	want := "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"
	if h.Hex() != want {
		t.Errorf("HashString(hello) = %s, want %s", h.Hex(), want)
	}
}

func TestSum(t *testing.T) {
	// Sum of ["hello", " ", "world"] should equal Hash([]byte("hello world"))
	a := Sum([]byte("hello"), []byte(" "), []byte("world"))
	b := Hash([]byte("hello world"))

	if !a.Equal(b) {
		t.Errorf("Sum mismatch: %s != %s", a.Hex(), b.Hex())
	}
}

func TestKnownVectors(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"", "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"},
		{"hello", "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"},
		{"The quick brown fox jumps over the lazy dog", "0x4d741b6f1eb29cb2a9b9911c82f56fa8d73b04959d3d9d222895df6c0b28aa15"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := HashString(tt.input).Hex()
			if got != tt.want {
				t.Errorf("got %s, want %s", got, tt.want)
			}
		})
	}
}

// FunctionSelector computes a function selector from a signature.
func FunctionSelector(signature string) []byte {
	h := HashString(signature)
	return h.Bytes()[:4]
}

func TestFunctionSelector(t *testing.T) {
	// transfer(address,uint256) = 0xa9059cbb
	selector := FunctionSelector("transfer(address,uint256)")
	want := []byte{0xa9, 0x05, 0x9c, 0xbb}

	if len(selector) != 4 {
		t.Fatalf("selector length = %d, want 4", len(selector))
	}
	for i, b := range selector {
		if b != want[i] {
			t.Errorf("selector[%d] = %02x, want %02x", i, b, want[i])
		}
	}
}
