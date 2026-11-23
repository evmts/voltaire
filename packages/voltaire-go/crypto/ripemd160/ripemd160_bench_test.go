package ripemd160

import "testing"

func BenchmarkHash32B(b *testing.B) {
	data := make([]byte, 32)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = Hash(data)
	}
}

func BenchmarkHash160(b *testing.B) {
	data := make([]byte, 64)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = Hash160(data)
	}
}
