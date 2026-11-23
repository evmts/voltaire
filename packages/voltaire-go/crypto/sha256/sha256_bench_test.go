package sha256

import "testing"

func BenchmarkHash32B(b *testing.B) {
	data := make([]byte, 32)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = Hash(data)
	}
}

func BenchmarkHash1KB(b *testing.B) {
	data := make([]byte, 1024)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = Hash(data)
	}
}

func BenchmarkDoubleHash(b *testing.B) {
	data := make([]byte, 64)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = DoubleHash(data)
	}
}
