package bytes32

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
	v := MustFromHex("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = v.Hex()
	}
}
