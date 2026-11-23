package hash

import "testing"

func BenchmarkFromHex(b *testing.B) {
	s := "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_, err := FromHex(s)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkHex(b *testing.B) {
	h := MustFromHex("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = h.Hex()
	}
}

func BenchmarkEqual(b *testing.B) {
	h1 := MustFromHex("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
	h2 := MustFromHex("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = h1.Equal(h2)
	}
}
