package evm

import (
	"bytes"
	"encoding/hex"
	"fmt"
	"testing"

	"github.com/evmts/guillotine/sdks/go/primitives"
)

func BenchmarkArithmeticOperations(b *testing.B) {
	benchmarks := []struct {
		name     string
		bytecode string
	}{
		{"ADD", "600a6014015f5260205ff3"},
		{"SUB", "6014600a035f5260205ff3"},
		{"MUL", "600a6014025f5260205ff3"},
		{"DIV", "6014600a045f5260205ff3"},
		{"MOD", "6014600a065f5260205ff3"},
		{"EXP", "600260080a5f5260205ff3"},
		{"ADDMOD", "6007600a6014085f5260205ff3"},
		{"MULMOD", "6007600a6005095f5260205ff3"},
	}

	for _, bm := range benchmarks {
		b.Run(bm.name, func(b *testing.B) {
			evm, _ := New()
			defer evm.Destroy()
			
			bytecode, _ := hex.DecodeString(bm.bytecode)
			
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_ = evm.Execute(bytecode)
			}
		})
	}
}

func BenchmarkBitwiseOperations(b *testing.B) {
	benchmarks := []struct {
		name     string
		bytecode string
	}{
		{"AND", "600f60ff165f5260205ff3"},
		{"OR", "600f60f0175f5260205ff3"},
		{"XOR", "60f060ff185f5260205ff3"},
		{"NOT", "60ff195f5260205ff3"},
		{"SHL", "600160081b5f5260205ff3"},
		{"SHR", "61010060081c5f5260205ff3"},
		{"BYTE", "60ff60001a5f5260205ff3"},
	}

	for _, bm := range benchmarks {
		b.Run(bm.name, func(b *testing.B) {
			evm, _ := New()
			defer evm.Destroy()
			
			bytecode, _ := hex.DecodeString(bm.bytecode)
			
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_ = evm.Execute(bytecode)
			}
		})
	}
}

func BenchmarkMemoryOperations(b *testing.B) {
	benchmarks := []struct {
		name     string
		bytecode string
	}{
		{"MSTORE_32", "60aa5f525f5360206000f3"},
		{"MSTORE8", "60ff5f535f60015360016000f3"},
		{"MLOAD", "60aa5f52205f5360206000f3"},
		{"MCOPY_32", "60aa5f5260205f60205e60206020f3"},
		{"MSIZE", "60aa5f5259"},
	}

	for _, bm := range benchmarks {
		b.Run(bm.name, func(b *testing.B) {
			evm, _ := New()
			defer evm.Destroy()
			
			bytecode, _ := hex.DecodeString(bm.bytecode)
			
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_ = evm.Execute(bytecode)
			}
		})
	}
}

func BenchmarkStorageOperations(b *testing.B) {
	benchmarks := []struct {
		name     string
		bytecode string
		setup    func(*EVM)
	}{
		{
			name:     "SSTORE_cold",
			bytecode: "60aa5f55",
			setup:    nil,
		},
		{
			name:     "SSTORE_warm",
			bytecode: "60bb5f55",
			setup: func(evm *EVM) {
				addr := NewAddress([20]byte{})
				key := NewU256FromUint64(0)
				value := NewU256FromUint64(0xaa)
				evm.SetStorage(&addr, &key, &value)
			},
		},
		{
			name:     "SLOAD_cold",
			bytecode: "5f54",
			setup:    nil,
		},
		{
			name:     "SLOAD_warm",
			bytecode: "5f545f54",
			setup: func(evm *EVM) {
				addr := NewAddress([20]byte{})
				key := NewU256FromUint64(0)
				value := NewU256FromUint64(0xaa)
				evm.SetStorage(&addr, &key, &value)
			},
		},
	}

	for _, bm := range benchmarks {
		b.Run(bm.name, func(b *testing.B) {
			bytecode, _ := hex.DecodeString(bm.bytecode)
			
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				evm, _ := New()
				if bm.setup != nil {
					bm.setup(evm)
				}
				_ = evm.Execute(bytecode)
				evm.Destroy()
			}
		})
	}
}

func BenchmarkStackOperations(b *testing.B) {
	benchmarks := []struct {
		name     string
		bytecode string
	}{
		{"PUSH1", "60aa"},
		{"PUSH32", "7f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"},
		{"POP", "60aa50"},
		{"DUP1", "60aa80"},
		{"DUP16", "6001600260036004600560066007600860096000a6000b6000c6000d6000e6000f60108f"},
		{"SWAP1", "60aa60bb90"},
		{"SWAP16", "6001600260036004600560066007600860096000a6000b6000c6000d6000e6000f60106011901f"},
	}

	for _, bm := range benchmarks {
		b.Run(bm.name, func(b *testing.B) {
			evm, _ := New()
			defer evm.Destroy()
			
			bytecode, _ := hex.DecodeString(bm.bytecode)
			
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_ = evm.Execute(bytecode)
			}
		})
	}
}

func BenchmarkControlFlow(b *testing.B) {
	benchmarks := []struct {
		name     string
		bytecode string
	}{
		{"JUMP", "600456005b60aa"},
		{"JUMPI_true", "6001600657005b60aa"},
		{"JUMPI_false", "5f600657005b60aa"},
		{"PC", "58"},
		{"JUMPDEST", "5b"},
	}

	for _, bm := range benchmarks {
		b.Run(bm.name, func(b *testing.B) {
			evm, _ := New()
			defer evm.Destroy()
			
			bytecode, _ := hex.DecodeString(bm.bytecode)
			
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_ = evm.Execute(bytecode)
			}
		})
	}
}

func BenchmarkKeccak256(b *testing.B) {
	benchmarks := []struct {
		name     string
		bytecode string
	}{
		{"KECCAK_0", "5f5f20"},
		{"KECCAK_32", "60aa5f5260205f20"},
		{"KECCAK_64", "60aa5f5260bb60205260405f20"},
		{"KECCAK_128", "60aa5f5260bb60205260cc60405260dd60605260805f20"},
		{"KECCAK_256", "7f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef5f527f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef6020527ffedcba9876543210fedcba9876543210fedcba9876543210fedcba98765432106040527ffedcba9876543210fedcba9876543210fedcba9876543210fedcba987654321060605261010060002000"},
	}

	for _, bm := range benchmarks {
		b.Run(bm.name, func(b *testing.B) {
			evm, _ := New()
			defer evm.Destroy()
			
			bytecode, _ := hex.DecodeString(bm.bytecode)
			
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_ = evm.Execute(bytecode)
			}
		})
	}
}

func BenchmarkCallOperations(b *testing.B) {
	benchmarks := []struct {
		name     string
		setup    func() ([]byte, *EVM)
	}{
		{
			name: "CALL_simple",
			setup: func() ([]byte, *EVM) {
				evm, _ := New()
				callerAddr := NewAddress([20]byte{0x01})
				calleeAddr := NewAddress([20]byte{0x02})
				balance := NewU256FromUint64(10000000)
				evm.SetBalance(&callerAddr, &balance)
				calleeCode := []byte{0x60, 0xaa, 0x5f, 0x52, 0x60, 0x20, 0x5f, 0xf3}
				evm.SetCode(&calleeAddr, calleeCode)
				bytecode, _ := hex.DecodeString("5f5f5f5f5f73" + hex.EncodeToString(calleeAddr.Bytes()) + "61fffff1")
				return bytecode, evm
			},
		},
		{
			name: "DELEGATECALL",
			setup: func() ([]byte, *EVM) {
				evm, _ := New()
				callerAddr := NewAddress([20]byte{0x03})
				delegateAddr := NewAddress([20]byte{0x04})
				balance := NewU256FromUint64(10000000)
				evm.SetBalance(&callerAddr, &balance)
				delegateCode := []byte{0x60, 0xbb, 0x5f, 0x52, 0x60, 0x20, 0x5f, 0xf3}
				evm.SetCode(&delegateAddr, delegateCode)
				bytecode, _ := hex.DecodeString("5f5f5f5f73" + hex.EncodeToString(delegateAddr.Bytes()) + "61fffff4")
				return bytecode, evm
			},
		},
		{
			name: "STATICCALL",
			setup: func() ([]byte, *EVM) {
				evm, _ := New()
				callerAddr := NewAddress([20]byte{0x05})
				staticAddr := NewAddress([20]byte{0x06})
				balance := NewU256FromUint64(10000000)
				evm.SetBalance(&callerAddr, &balance)
				staticCode := []byte{0x60, 0xcc, 0x5f, 0x52, 0x60, 0x20, 0x5f, 0xf3}
				evm.SetCode(&staticAddr, staticCode)
				bytecode, _ := hex.DecodeString("5f5f5f5f73" + hex.EncodeToString(staticAddr.Bytes()) + "61fffffa")
				return bytecode, evm
			},
		},
	}

	for _, bm := range benchmarks {
		b.Run(bm.name, func(b *testing.B) {
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				bytecode, evm := bm.setup()
				_ = evm.Execute(bytecode)
				evm.Destroy()
			}
		})
	}
}

func BenchmarkContractCreation(b *testing.B) {
	benchmarks := []struct {
		name     string
		bytecode string
	}{
		{"CREATE_empty", "5f5f5ff0"},
		{"CREATE_simple", "60806040525f5260205ff35f5f5ff0"},
		{"CREATE2_empty", "5f5f5f5ff5"},
		{"CREATE2_simple", "60806040525f5260205ff35f5f5f7f00000000000000000000000000000000000000000000000000000000000000015ff5"},
	}

	for _, bm := range benchmarks {
		b.Run(bm.name, func(b *testing.B) {
			bytecode, _ := hex.DecodeString(bm.bytecode)
			
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				evm, _ := New()
				addr := NewAddress([20]byte{byte(i)})
				balance := NewU256FromUint64(10000000)
				evm.SetBalance(&addr, &balance)
				_ = evm.ExecuteWithAddress(bytecode, &addr)
				evm.Destroy()
			}
		})
	}
}

func BenchmarkComplexScenarios(b *testing.B) {
	benchmarks := []struct {
		name     string
		bytecode string
	}{
		{
			name:     "Fibonacci_10",
			bytecode: "600a5f60015b8283018084116100165790509150806002575b5050",
		},
		{
			name:     "Loop_100",
			bytecode: "60645f5b8060010360008112610014576100085661001a565b50",
		},
		{
			name:     "ERC20_transfer",
			bytecode: "60646000546103e8900360005560646001546103e8010160015560206000f3",
		},
		{
			name:     "Memory_expansion_1KB",
			bytecode: "61040060005260206000f3",
		},
		{
			name:     "Storage_10_writes",
			bytecode: "60015f5560026001556003600255600460035560056004556006600555600760065560086007556009600855600a600955",
		},
	}

	for _, bm := range benchmarks {
		b.Run(bm.name, func(b *testing.B) {
			evm, _ := New()
			defer evm.Destroy()
			
			bytecode, _ := hex.DecodeString(bm.bytecode)
			
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_ = evm.Execute(bytecode)
			}
		})
	}
}

func BenchmarkGasIntensive(b *testing.B) {
	benchmarks := []struct {
		name     string
		bytecode string
	}{
		{
			name:     "SSTORE_cold_10",
			bytecode: "60015f5560026001556003600255600460035560056004556006600555600760065560086007556009600855600a600955",
		},
		{
			name:     "KECCAK_large",
			bytecode: bytes.Repeat([]byte{0x60, 0xaa}, 512) + []byte{0x61, 0x10, 0x00, 0x5f, 0x20},
		},
		{
			name:     "Memory_10MB",
			bytecode: "7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6298968052",
		},
	}

	for _, bm := range benchmarks {
		b.Run(bm.name, func(b *testing.B) {
			var bytecode []byte
			if bm.name == "KECCAK_large" {
				bytecode = bytes.Repeat([]byte{0x60, 0xaa}, 512)
				bytecode = append(bytecode, []byte{0x61, 0x10, 0x00, 0x5f, 0x20}...)
			} else {
				bytecode, _ = hex.DecodeString(bm.bytecode)
			}
			
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				evm, _ := New()
				gasLimit := NewU256FromUint64(30000000)
				evm.SetGasLimit(&gasLimit)
				_ = evm.Execute(bytecode)
				evm.Destroy()
			}
		})
	}
}

func BenchmarkRealWorldContracts(b *testing.B) {
	benchmarks := []struct {
		name  string
		setup func() ([]byte, *EVM)
	}{
		{
			name: "UniswapV2_swap",
			setup: func() ([]byte, *EVM) {
				evm, _ := New()
				reserve0Slot := NewU256FromUint64(0)
				reserve1Slot := NewU256FromUint64(1)
				reserve0 := NewU256FromUint64(1000000)
				reserve1 := NewU256FromUint64(2000000)
				addr := NewAddress([20]byte{})
				evm.SetStorage(&addr, &reserve0Slot, &reserve0)
				evm.SetStorage(&addr, &reserve1Slot, &reserve1)
				bytecode, _ := hex.DecodeString("5f5460015402619c40116100165761001c5661001c5b60016001555b")
				return bytecode, evm
			},
		},
		{
			name: "ERC721_mint",
			setup: func() ([]byte, *EVM) {
				evm, _ := New()
				totalSupplySlot := NewU256FromUint64(0)
				currentSupply := NewU256FromUint64(100)
				addr := NewAddress([20]byte{})
				evm.SetStorage(&addr, &totalSupplySlot, &currentSupply)
				bytecode, _ := hex.DecodeString("5f5460010160648111610019576001810190555f52602001f35bfd")
				return bytecode, evm
			},
		},
	}

	for _, bm := range benchmarks {
		b.Run(bm.name, func(b *testing.B) {
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				bytecode, evm := bm.setup()
				_ = evm.Execute(bytecode)
				evm.Destroy()
			}
		})
	}
}

func BenchmarkParallelExecution(b *testing.B) {
	bytecode, _ := hex.DecodeString("600a6014015f5260205ff3")
	
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			evm, _ := New()
			_ = evm.Execute(bytecode)
			evm.Destroy()
		}
	})
}

func BenchmarkMemoryAllocation(b *testing.B) {
	sizes := []int{32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384}
	
	for _, size := range sizes {
		b.Run(fmt.Sprintf("size_%d", size), func(b *testing.B) {
			bytecode := fmt.Sprintf("60aa%04x52", size)
			bc, _ := hex.DecodeString(bytecode)
			
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				evm, _ := New()
				_ = evm.Execute(bc)
				evm.Destroy()
			}
		})
	}
}

func BenchmarkCachePerformance(b *testing.B) {
	benchmarks := []struct {
		name     string
		bytecode string
	}{
		{
			name:     "Sequential_reads",
			bytecode: "5f545f545f545f545f545f545f545f54",
		},
		{
			name:     "Random_reads",
			bytecode: "5f546001546002546003546004546005546006546007546008546009545",
		},
		{
			name:     "Sequential_writes",
			bytecode: "60aa5f5560bb60015560cc60025560dd60035560ee60045560ff600555",
		},
		{
			name:     "Alternating_read_write",
			bytecode: "5f5460aa5f556001546001600155600254600260025560035460036003555",
		},
	}

	for _, bm := range benchmarks {
		b.Run(bm.name, func(b *testing.B) {
			evm, _ := New()
			defer evm.Destroy()
			
			for i := uint64(0); i < 10; i++ {
				slot := NewU256FromUint64(i)
				value := NewU256FromUint64(i * 10)
				addr := NewAddress([20]byte{})
				evm.SetStorage(&addr, &slot, &value)
			}
			
			bytecode, _ := hex.DecodeString(bm.bytecode)
			
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_ = evm.Execute(bytecode)
			}
		})
	}
}