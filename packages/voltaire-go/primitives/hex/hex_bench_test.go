package hex

import "testing"

func BenchmarkEncode32B(b *testing.B) {
	data := make([]byte, 32)
	for i := range data {
		data[i] = byte(i)
	}
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = Encode(data)
	}
}

func BenchmarkEncode1KB(b *testing.B) {
	data := make([]byte, 1024)
	for i := range data {
		data[i] = byte(i)
	}
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = Encode(data)
	}
}

func BenchmarkDecode32B(b *testing.B) {
	s := "0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_, err := Decode(s)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkDecode1KB(b *testing.B) {
	data := make([]byte, 1024)
	for i := range data {
		data[i] = byte(i)
	}
	s := Encode(data)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_, err := Decode(s)
		if err != nil {
			b.Fatal(err)
		}
	}
}
