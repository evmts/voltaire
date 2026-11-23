package privatekey

import "testing"

func BenchmarkFromHex(b *testing.B) {
	s := "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_, err := FromHex(s)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkPublicKey(b *testing.B) {
	pk := MustFromHex("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = pk.PublicKey()
	}
}

func BenchmarkAddress(b *testing.B) {
	pk := MustFromHex("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = pk.Address()
	}
}
