package sha256

import (
	"testing"
)

func TestHash(t *testing.T) {
	// SHA256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
	emptyHash := Hash([]byte{})
	want := "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
	if emptyHash.Hex() != want {
		t.Errorf("Hash([]) = %s, want %s", emptyHash.Hex(), want)
	}
}

func TestHashString(t *testing.T) {
	// SHA256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
	h := HashString("hello")
	want := "0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
	if h.Hex() != want {
		t.Errorf("HashString(hello) = %s, want %s", h.Hex(), want)
	}
}

func TestDoubleHash(t *testing.T) {
	// Double hash is used in Bitcoin
	h := DoubleHash([]byte("hello"))
	// SHA256(SHA256("hello"))
	want := "0x9595c9df90075148eb06860365df33584b75bff782a510c6cd4883a419833d50"
	if h.Hex() != want {
		t.Errorf("DoubleHash(hello) = %s, want %s", h.Hex(), want)
	}
}

func TestKnownVectors(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"", "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},
		{"hello", "0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"},
		{"abc", "0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"},
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
