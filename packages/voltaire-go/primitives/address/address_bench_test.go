package address

import "testing"

func BenchmarkFromHex(b *testing.B) {
	hexStr := "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_, err := FromHex(hexStr)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkFromBytes(b *testing.B) {
	raw := []byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20}
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_, err := FromBytes(raw)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkHex(b *testing.B) {
	addr := MustFromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = addr.Hex()
	}
}

func BenchmarkChecksumHex(b *testing.B) {
	addr := MustFromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = addr.ChecksumHex()
	}
}

func BenchmarkValidateChecksum(b *testing.B) {
	s := "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = ValidateChecksum(s)
	}
}

func BenchmarkEqual(b *testing.B) {
	a := MustFromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
	c := MustFromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = a.Equal(c)
	}
}
