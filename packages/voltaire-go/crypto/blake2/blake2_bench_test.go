package blake2

import "testing"

func BenchmarkHash32B(b *testing.B) {
	data := make([]byte, 32)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = Hash(data)
	}
}

func BenchmarkHash512_1KB(b *testing.B) {
	data := make([]byte, 1024)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = Hash512(data)
	}
}
