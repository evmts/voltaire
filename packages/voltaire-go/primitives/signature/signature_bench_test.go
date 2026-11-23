package signature

import "testing"

func BenchmarkFromRSV(b *testing.B) {
	var r, s [32]byte
	r[31] = 1
	s[31] = 2
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = FromRSV(r, s, 27)
	}
}

func BenchmarkIsLowS(b *testing.B) {
	var r, s [32]byte
	r[31] = 1
	s[31] = 2
	sig := FromRSV(r, s, 27)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = sig.IsLowS()
	}
}

func BenchmarkHex(b *testing.B) {
	var r, s [32]byte
	r[31] = 1
	s[31] = 2
	sig := FromRSV(r, s, 27)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = sig.Hex()
	}
}
