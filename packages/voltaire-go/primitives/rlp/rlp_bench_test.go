package rlp

import "testing"

func BenchmarkEncodeShortBytes(b *testing.B) {
	data := []byte{0xde, 0xad, 0xbe, 0xef}
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_, err := Encode(data)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkEncodeLongBytes(b *testing.B) {
	data := make([]byte, 1024)
	for i := range data {
		data[i] = byte(i)
	}
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_, err := Encode(data)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkEncodeList(b *testing.B) {
	items := []interface{}{
		[]byte{0xde, 0xad},
		[]byte{0xbe, 0xef},
		[]byte{0xca, 0xfe},
		[]interface{}{[]byte{0x01}, []byte{0x02}},
	}
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_, err := EncodeList(items)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkDecodeList(b *testing.B) {
	items := []interface{}{
		[]byte{0xde, 0xad},
		[]byte{0xbe, 0xef},
		[]byte{0xca, 0xfe},
	}
	encoded, err := EncodeList(items)
	if err != nil {
		b.Fatal(err)
	}
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_, err := DecodeBytes(encoded)
		if err != nil {
			b.Fatal(err)
		}
	}
}
