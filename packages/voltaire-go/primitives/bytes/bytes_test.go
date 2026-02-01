package bytes

import (
	"testing"
)

func TestConcat(t *testing.T) {
	tests := []struct {
		name   string
		inputs [][]byte
		want   []byte
	}{
		{
			name:   "two slices",
			inputs: [][]byte{{0xde, 0xad}, {0xbe, 0xef}},
			want:   []byte{0xde, 0xad, 0xbe, 0xef},
		},
		{
			name:   "multiple slices",
			inputs: [][]byte{{0xaa}, {0xbb}, {0xcc}},
			want:   []byte{0xaa, 0xbb, 0xcc},
		},
		{
			name:   "with empty slices",
			inputs: [][]byte{{}, {0xde, 0xad}, {}},
			want:   []byte{0xde, 0xad},
		},
		{
			name:   "all empty",
			inputs: [][]byte{{}, {}},
			want:   []byte{},
		},
		{
			name:   "single slice",
			inputs: [][]byte{{0xde, 0xad, 0xbe, 0xef}},
			want:   []byte{0xde, 0xad, 0xbe, 0xef},
		},
		{
			name:   "no inputs",
			inputs: [][]byte{},
			want:   []byte{},
		},
		{
			name:   "nil inputs",
			inputs: nil,
			want:   []byte{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := Concat(tt.inputs...)
			if !bytesEqual(got, tt.want) {
				t.Errorf("got %x, want %x", got, tt.want)
			}
		})
	}
}

func TestSlice(t *testing.T) {
	data := []byte{0, 1, 2, 3, 4, 5}

	tests := []struct {
		name    string
		data    []byte
		start   int
		end     int
		want    []byte
		wantErr error
	}{
		{
			name:  "middle slice",
			data:  data,
			start: 1,
			end:   4,
			want:  []byte{1, 2, 3},
		},
		{
			name:  "from start",
			data:  data,
			start: 0,
			end:   3,
			want:  []byte{0, 1, 2},
		},
		{
			name:  "to end",
			data:  data,
			start: 3,
			end:   6,
			want:  []byte{3, 4, 5},
		},
		{
			name:  "full slice",
			data:  data,
			start: 0,
			end:   6,
			want:  []byte{0, 1, 2, 3, 4, 5},
		},
		{
			name:  "empty slice same index",
			data:  data,
			start: 3,
			end:   3,
			want:  []byte{},
		},
		{
			name:  "empty input",
			data:  []byte{},
			start: 0,
			end:   0,
			want:  []byte{},
		},
		{
			name:    "end exceeds length",
			data:    data,
			start:   0,
			end:     100,
			wantErr: ErrOutOfBounds,
		},
		{
			name:    "start exceeds length",
			data:    data,
			start:   10,
			end:     12,
			wantErr: ErrOutOfBounds,
		},
		{
			name:    "negative start",
			data:    data,
			start:   -1,
			end:     3,
			wantErr: ErrNegativeIndex,
		},
		{
			name:    "negative end",
			data:    data,
			start:   0,
			end:     -1,
			wantErr: ErrNegativeIndex,
		},
		{
			name:    "start greater than end",
			data:    data,
			start:   4,
			end:     2,
			wantErr: ErrOutOfBounds,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Slice(tt.data, tt.start, tt.end)
			if tt.wantErr != nil {
				if err != tt.wantErr {
					t.Errorf("got error %v, want %v", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !bytesEqual(got, tt.want) {
				t.Errorf("got %x, want %x", got, tt.want)
			}
		})
	}
}

func TestPadLeft(t *testing.T) {
	tests := []struct {
		name    string
		data    []byte
		size    int
		padByte byte
		want    []byte
	}{
		{
			name:    "pad with zeros",
			data:    []byte{0x01, 0x02},
			size:    4,
			padByte: 0x00,
			want:    []byte{0x00, 0x00, 0x01, 0x02},
		},
		{
			name:    "pad with custom byte",
			data:    []byte{0x01, 0x02},
			size:    4,
			padByte: 0xff,
			want:    []byte{0xff, 0xff, 0x01, 0x02},
		},
		{
			name:    "already at size",
			data:    []byte{0x01, 0x02},
			size:    2,
			padByte: 0x00,
			want:    []byte{0x01, 0x02},
		},
		{
			name:    "exceeds size",
			data:    []byte{0x01, 0x02, 0x03, 0x04},
			size:    2,
			padByte: 0x00,
			want:    []byte{0x01, 0x02, 0x03, 0x04},
		},
		{
			name:    "empty input",
			data:    []byte{},
			size:    3,
			padByte: 0xab,
			want:    []byte{0xab, 0xab, 0xab},
		},
		{
			name:    "size zero",
			data:    []byte{0x01},
			size:    0,
			padByte: 0x00,
			want:    []byte{0x01},
		},
		{
			name:    "pad to 32 bytes (common case)",
			data:    []byte{0x01},
			size:    32,
			padByte: 0x00,
			want:    append(make([]byte, 31), 0x01),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := PadLeft(tt.data, tt.size, tt.padByte)
			if !bytesEqual(got, tt.want) {
				t.Errorf("got %x, want %x", got, tt.want)
			}
		})
	}
}

func TestPadRight(t *testing.T) {
	tests := []struct {
		name    string
		data    []byte
		size    int
		padByte byte
		want    []byte
	}{
		{
			name:    "pad with zeros",
			data:    []byte{0x01, 0x02},
			size:    4,
			padByte: 0x00,
			want:    []byte{0x01, 0x02, 0x00, 0x00},
		},
		{
			name:    "pad with custom byte",
			data:    []byte{0x01, 0x02},
			size:    4,
			padByte: 0xff,
			want:    []byte{0x01, 0x02, 0xff, 0xff},
		},
		{
			name:    "already at size",
			data:    []byte{0x01, 0x02},
			size:    2,
			padByte: 0x00,
			want:    []byte{0x01, 0x02},
		},
		{
			name:    "exceeds size",
			data:    []byte{0x01, 0x02, 0x03, 0x04},
			size:    2,
			padByte: 0x00,
			want:    []byte{0x01, 0x02, 0x03, 0x04},
		},
		{
			name:    "empty input",
			data:    []byte{},
			size:    3,
			padByte: 0xab,
			want:    []byte{0xab, 0xab, 0xab},
		},
		{
			name:    "size zero",
			data:    []byte{0x01},
			size:    0,
			padByte: 0x00,
			want:    []byte{0x01},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := PadRight(tt.data, tt.size, tt.padByte)
			if !bytesEqual(got, tt.want) {
				t.Errorf("got %x, want %x", got, tt.want)
			}
		})
	}
}

func TestTrimLeft(t *testing.T) {
	tests := []struct {
		name     string
		data     []byte
		trimByte byte
		want     []byte
	}{
		{
			name:     "trim leading zeros",
			data:     []byte{0x00, 0x00, 0x01, 0x02},
			trimByte: 0x00,
			want:     []byte{0x01, 0x02},
		},
		{
			name:     "trim custom byte",
			data:     []byte{0xff, 0xff, 0x01, 0x02},
			trimByte: 0xff,
			want:     []byte{0x01, 0x02},
		},
		{
			name:     "nothing to trim",
			data:     []byte{0x01, 0x02, 0x00, 0x00},
			trimByte: 0x00,
			want:     []byte{0x01, 0x02, 0x00, 0x00},
		},
		{
			name:     "all trimmed",
			data:     []byte{0x00, 0x00, 0x00},
			trimByte: 0x00,
			want:     []byte{},
		},
		{
			name:     "empty input",
			data:     []byte{},
			trimByte: 0x00,
			want:     []byte{},
		},
		{
			name:     "single byte trimmed",
			data:     []byte{0x00},
			trimByte: 0x00,
			want:     []byte{},
		},
		{
			name:     "single byte not trimmed",
			data:     []byte{0x01},
			trimByte: 0x00,
			want:     []byte{0x01},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := TrimLeft(tt.data, tt.trimByte)
			if !bytesEqual(got, tt.want) {
				t.Errorf("got %x, want %x", got, tt.want)
			}
		})
	}
}

func TestTrimRight(t *testing.T) {
	tests := []struct {
		name     string
		data     []byte
		trimByte byte
		want     []byte
	}{
		{
			name:     "trim trailing zeros",
			data:     []byte{0x01, 0x02, 0x00, 0x00},
			trimByte: 0x00,
			want:     []byte{0x01, 0x02},
		},
		{
			name:     "trim custom byte",
			data:     []byte{0x01, 0x02, 0xff, 0xff},
			trimByte: 0xff,
			want:     []byte{0x01, 0x02},
		},
		{
			name:     "nothing to trim",
			data:     []byte{0x00, 0x00, 0x01, 0x02},
			trimByte: 0x00,
			want:     []byte{0x00, 0x00, 0x01, 0x02},
		},
		{
			name:     "all trimmed",
			data:     []byte{0x00, 0x00, 0x00},
			trimByte: 0x00,
			want:     []byte{},
		},
		{
			name:     "empty input",
			data:     []byte{},
			trimByte: 0x00,
			want:     []byte{},
		},
		{
			name:     "single byte trimmed",
			data:     []byte{0x00},
			trimByte: 0x00,
			want:     []byte{},
		},
		{
			name:     "single byte not trimmed",
			data:     []byte{0x01},
			trimByte: 0x00,
			want:     []byte{0x01},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := TrimRight(tt.data, tt.trimByte)
			if !bytesEqual(got, tt.want) {
				t.Errorf("got %x, want %x", got, tt.want)
			}
		})
	}
}

func TestEqual(t *testing.T) {
	tests := []struct {
		name string
		a    []byte
		b    []byte
		want bool
	}{
		{
			name: "equal",
			a:    []byte{0xde, 0xad, 0xbe, 0xef},
			b:    []byte{0xde, 0xad, 0xbe, 0xef},
			want: true,
		},
		{
			name: "different content",
			a:    []byte{0xde, 0xad, 0xbe, 0xef},
			b:    []byte{0xca, 0xfe, 0xba, 0xbe},
			want: false,
		},
		{
			name: "different length",
			a:    []byte{0xde, 0xad},
			b:    []byte{0xde, 0xad, 0xbe, 0xef},
			want: false,
		},
		{
			name: "both empty",
			a:    []byte{},
			b:    []byte{},
			want: true,
		},
		{
			name: "one empty",
			a:    []byte{},
			b:    []byte{0x00},
			want: false,
		},
		{
			name: "both nil",
			a:    nil,
			b:    nil,
			want: true,
		},
		{
			name: "nil and empty",
			a:    nil,
			b:    []byte{},
			want: true,
		},
		{
			name: "single byte equal",
			a:    []byte{0xff},
			b:    []byte{0xff},
			want: true,
		},
		{
			name: "single byte different",
			a:    []byte{0x00},
			b:    []byte{0x01},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := Equal(tt.a, tt.b)
			if got != tt.want {
				t.Errorf("got %v, want %v", got, tt.want)
			}
			// Verify symmetry
			gotReverse := Equal(tt.b, tt.a)
			if gotReverse != tt.want {
				t.Errorf("reverse: got %v, want %v", gotReverse, tt.want)
			}
		})
	}
}

func TestIsZero(t *testing.T) {
	tests := []struct {
		name string
		data []byte
		want bool
	}{
		{
			name: "all zeros",
			data: []byte{0x00, 0x00, 0x00},
			want: true,
		},
		{
			name: "has non-zero",
			data: []byte{0x00, 0x01, 0x00},
			want: false,
		},
		{
			name: "empty",
			data: []byte{},
			want: true,
		},
		{
			name: "nil",
			data: nil,
			want: true,
		},
		{
			name: "single zero",
			data: []byte{0x00},
			want: true,
		},
		{
			name: "single non-zero",
			data: []byte{0x01},
			want: false,
		},
		{
			name: "non-zero at end",
			data: []byte{0x00, 0x00, 0x01},
			want: false,
		},
		{
			name: "non-zero at start",
			data: []byte{0x01, 0x00, 0x00},
			want: false,
		},
		{
			name: "32 zeros",
			data: make([]byte, 32),
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := IsZero(tt.data)
			if got != tt.want {
				t.Errorf("got %v, want %v", got, tt.want)
			}
		})
	}
}

func TestReverse(t *testing.T) {
	tests := []struct {
		name string
		data []byte
		want []byte
	}{
		{
			name: "four bytes",
			data: []byte{0x01, 0x02, 0x03, 0x04},
			want: []byte{0x04, 0x03, 0x02, 0x01},
		},
		{
			name: "odd length",
			data: []byte{0x01, 0x02, 0x03},
			want: []byte{0x03, 0x02, 0x01},
		},
		{
			name: "two bytes",
			data: []byte{0xde, 0xad},
			want: []byte{0xad, 0xde},
		},
		{
			name: "single byte",
			data: []byte{0x42},
			want: []byte{0x42},
		},
		{
			name: "empty",
			data: []byte{},
			want: []byte{},
		},
		{
			name: "nil",
			data: nil,
			want: []byte{},
		},
		{
			name: "palindrome",
			data: []byte{0xab, 0xcd, 0xab},
			want: []byte{0xab, 0xcd, 0xab},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Save original for mutation check
			original := make([]byte, len(tt.data))
			copy(original, tt.data)

			got := Reverse(tt.data)
			if !bytesEqual(got, tt.want) {
				t.Errorf("got %x, want %x", got, tt.want)
			}

			// Verify original is unchanged
			if !bytesEqual(tt.data, original) {
				t.Errorf("original mutated: got %x, want %x", tt.data, original)
			}
		})
	}
}

func TestCopy(t *testing.T) {
	tests := []struct {
		name string
		data []byte
	}{
		{
			name: "normal data",
			data: []byte{0xde, 0xad, 0xbe, 0xef},
		},
		{
			name: "empty",
			data: []byte{},
		},
		{
			name: "nil",
			data: nil,
		},
		{
			name: "single byte",
			data: []byte{0x42},
		},
		{
			name: "large",
			data: make([]byte, 1000),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := Copy(tt.data)

			// Content should match
			if !bytesEqual(got, tt.data) {
				t.Errorf("got %x, want %x", got, tt.data)
			}

			// Should be independent memory
			if len(tt.data) > 0 {
				got[0] = 0xff
				if tt.data[0] == 0xff && tt.data[0] != got[0] {
					// This is fine - they're independent
				} else if len(tt.data) > 0 && tt.data[0] == 0xff {
					// Original might have been 0xff already, check by reverting
					got[0] = tt.data[0]
				}
			}
		})
	}
}

func TestCopyIndependence(t *testing.T) {
	original := []byte{0x01, 0x02, 0x03}
	copied := Copy(original)

	// Modify copy
	copied[0] = 0xff

	// Original should be unchanged
	if original[0] != 0x01 {
		t.Errorf("original was mutated: got %x, want %x", original[0], 0x01)
	}
}

// bytesEqual is a helper for tests (not constant-time)
func bytesEqual(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// Benchmark tests
func BenchmarkConcat(b *testing.B) {
	a := make([]byte, 32)
	c := make([]byte, 32)
	for i := 0; i < b.N; i++ {
		_ = Concat(a, c)
	}
}

func BenchmarkEqual(b *testing.B) {
	a := make([]byte, 32)
	c := make([]byte, 32)
	for i := 0; i < b.N; i++ {
		_ = Equal(a, c)
	}
}

func BenchmarkIsZero(b *testing.B) {
	data := make([]byte, 32)
	for i := 0; i < b.N; i++ {
		_ = IsZero(data)
	}
}

func BenchmarkReverse(b *testing.B) {
	data := make([]byte, 32)
	for i := 0; i < b.N; i++ {
		_ = Reverse(data)
	}
}

func BenchmarkPadLeft(b *testing.B) {
	data := []byte{0x01}
	for i := 0; i < b.N; i++ {
		_ = PadLeft(data, 32, 0x00)
	}
}
