package blake2

import (
	"encoding/hex"
	"hash"
	"testing"
)

func TestHash(t *testing.T) {
	// BLAKE2b-256 of empty input
	emptyHash := Hash([]byte{})
	want := "0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8"
	got := hex.EncodeToString(emptyHash[:])
	if got != want {
		t.Errorf("Hash([]) = %s, want %s", got, want)
	}
}

func TestHash512(t *testing.T) {
	// BLAKE2b-512 of empty input (RFC 7693)
	emptyHash := Hash512([]byte{})
	want := "786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce"
	got := hex.EncodeToString(emptyHash[:])
	if got != want {
		t.Errorf("Hash512([]) = %s, want %s", got, want)
	}
}

func TestHashString(t *testing.T) {
	// BLAKE2b-256 of "abc"
	h := HashString("abc")
	want := "bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319"
	got := hex.EncodeToString(h[:])
	if got != want {
		t.Errorf("HashString(abc) = %s, want %s", got, want)
	}
}

func TestHashToHex(t *testing.T) {
	h := HashToHex([]byte{})
	want := "0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8"
	if h != want {
		t.Errorf("HashToHex([]) = %s, want %s", h, want)
	}
}

func TestNew256(t *testing.T) {
	h, err := New256()
	if err != nil {
		t.Fatalf("New256() error: %v", err)
	}

	h.Write([]byte("abc"))
	result := h.Sum(nil)

	want := "bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319"
	got := hex.EncodeToString(result)
	if got != want {
		t.Errorf("New256().Sum() = %s, want %s", got, want)
	}
}

func TestNew512(t *testing.T) {
	h, err := New512()
	if err != nil {
		t.Fatalf("New512() error: %v", err)
	}

	h.Write([]byte("abc"))
	result := h.Sum(nil)

	want := "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923"
	got := hex.EncodeToString(result)
	if got != want {
		t.Errorf("New512().Sum() = %s, want %s", got, want)
	}
}

func TestSum256Alias(t *testing.T) {
	data := []byte("test")
	hash := Hash(data)
	sum := Sum256(data)
	if hash != sum {
		t.Errorf("Sum256 != Hash")
	}
}

func TestSum512Alias(t *testing.T) {
	data := []byte("test")
	hash := Hash512(data)
	sum := Sum512(data)
	if hash != sum {
		t.Errorf("Sum512 != Hash512")
	}
}

func TestRFC7693Vectors(t *testing.T) {
	// RFC 7693 Appendix A test vectors for BLAKE2b-512
	tests := []struct {
		name  string
		input []byte
		want  string
	}{
		{
			name:  "empty",
			input: []byte{},
			want:  "786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce",
		},
		{
			name:  "abc",
			input: []byte{0x61, 0x62, 0x63},
			want:  "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923",
		},
		{
			name:  "single zero byte",
			input: []byte{0x00},
			want:  "2fa3f686df876995167e7c2e5d74c4c7b6e48f8068fe0e44208344d480f7904c36963e44115fe3eb2a3ac8694c28bcb4f5a0f3276f2e79487d8219057a506e4b",
		},
		{
			name:  "two bytes",
			input: []byte{0x00, 0x01},
			want:  "1c08798dc641aba9dee435e22519a4729a09b2bfe0ff00ef2dcd8ed6f8a07d15eaf4aee52bbf18ab5608a6190f70b90486c8a7d4873710b1115d3debbb4327b5",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := Hash512(tt.input)
			got := hex.EncodeToString(h[:])
			if got != tt.want {
				t.Errorf("Hash512(%v) = %s, want %s", tt.input, got, tt.want)
			}
		})
	}
}

func TestBlake2b256Vectors(t *testing.T) {
	// BLAKE2b-256 test vectors
	tests := []struct {
		name  string
		input []byte
		want  string
	}{
		{
			name:  "empty",
			input: []byte{},
			want:  "0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8",
		},
		{
			name:  "abc",
			input: []byte("abc"),
			want:  "bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := Hash(tt.input)
			got := hex.EncodeToString(h[:])
			if got != tt.want {
				t.Errorf("Hash(%v) = %s, want %s", tt.input, got, tt.want)
			}
		})
	}
}

func TestIncrementalHashing(t *testing.T) {
	// Incremental should match one-shot
	data := []byte("hello world")

	oneShot := Hash(data)

	h, _ := New256()
	h.Write([]byte("hello"))
	h.Write([]byte(" "))
	h.Write([]byte("world"))
	incremental := h.Sum(nil)

	if hex.EncodeToString(oneShot[:]) != hex.EncodeToString(incremental) {
		t.Error("Incremental hash doesn't match one-shot")
	}
}

func TestHashInterface(t *testing.T) {
	// Verify New256 and New512 return hash.Hash
	var _ hash.Hash
	h256, err := New256()
	if err != nil {
		t.Fatal(err)
	}
	var _ hash.Hash = h256

	h512, err := New512()
	if err != nil {
		t.Fatal(err)
	}
	var _ hash.Hash = h512
}

func TestDeterministic(t *testing.T) {
	data := []byte("test data")

	h1 := Hash(data)
	h2 := Hash(data)

	if h1 != h2 {
		t.Error("Hash should be deterministic")
	}
}

func TestDifferentInputs(t *testing.T) {
	h1 := Hash([]byte{0x00})
	h2 := Hash([]byte{0x01})
	h3 := Hash([]byte{0x00, 0x00})

	if h1 == h2 || h1 == h3 || h2 == h3 {
		t.Error("Different inputs should produce different hashes")
	}
}

func TestLargeInput(t *testing.T) {
	// 1MB input
	data := make([]byte, 1024*1024)
	for i := range data {
		data[i] = byte(i & 0xff)
	}

	h1 := Hash(data)
	h2 := Hash(data)

	if h1 != h2 {
		t.Error("Large input hash should be deterministic")
	}
}
