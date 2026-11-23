package u256

import (
	"math/big"
	"testing"
)

func BenchmarkFromHex(b *testing.B) {
	s := "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000"
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_, err := FromHex(s)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkFromBigInt(b *testing.B) {
	n := new(big.Int).SetUint64(1_000_000_000_000_000_000)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_, err := FromBigInt(n)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkHex(b *testing.B) {
	v := FromUint64(1_000_000_000_000_000_000)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = v.Hex()
	}
}

func BenchmarkBigInt(b *testing.B) {
	v := FromUint64(1_000_000_000_000_000_000)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = v.BigInt()
	}
}
