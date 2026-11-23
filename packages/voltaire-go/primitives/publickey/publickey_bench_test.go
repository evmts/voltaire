package publickey

import "testing"

// generatorPoint returns the uncompressed secp256k1 generator G as x || y.
func generatorPoint() []byte {
	return append(append([]byte{}, generatorX...), generatorY...)
}

func BenchmarkFromBytesAndAddress(b *testing.B) {
	pk, err := FromBytes(generatorPoint())
	if err != nil {
		b.Fatal(err)
	}
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = pk.Address()
	}
}

func BenchmarkBytesCompressed(b *testing.B) {
	pk, err := FromBytes(generatorPoint())
	if err != nil {
		b.Fatal(err)
	}
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = pk.BytesCompressed()
	}
}
