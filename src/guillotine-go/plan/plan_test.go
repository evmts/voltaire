package plan

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/evmts/guillotine/bindings/go/primitives"
)

// Test data: Simple bytecode with PUSH1, ADD, STOP
var testBytecode = []byte{0x60, 0x42, 0x60, 0x10, 0x01, 0x00} // PUSH1 0x42, PUSH1 0x10, ADD, STOP

// Test data: Bytecode with JUMPDEST
var jumpBytecode = []byte{0x60, 0x05, 0x56, 0x00, 0x5B, 0x00} // PUSH1 5, JUMP, STOP, JUMPDEST, STOP

func TestPlan_New(t *testing.T) {
	ctx := context.Background()

	t.Run("ValidBytecode", func(t *testing.T) {
		// This test should initially fail - we need to implement New()
		plan, err := New(ctx, testBytecode)
		require.NoError(t, err)
		require.NotNil(t, plan)
		
		// Plan should have been created successfully
		assert.True(t, len(plan.Bytecode()) > 0)
		assert.Equal(t, testBytecode, plan.Bytecode())
	})

	t.Run("EmptyBytecode", func(t *testing.T) {
		// Should handle empty bytecode gracefully
		plan, err := New(ctx, []byte{})
		assert.Error(t, err)
		assert.Nil(t, plan)
		assert.Contains(t, err.Error(), "empty bytecode")
	})

	t.Run("NilBytecode", func(t *testing.T) {
		// Should handle nil bytecode
		plan, err := New(ctx, nil)
		assert.Error(t, err)
		assert.Nil(t, plan)
		assert.Contains(t, err.Error(), "nil bytecode")
	})

	t.Run("OversizedBytecode", func(t *testing.T) {
		// Should reject bytecode that's too large
		oversized := make([]byte, 25000) // Larger than max contract size
		plan, err := New(ctx, oversized)
		assert.Error(t, err)
		assert.Nil(t, plan)
		assert.Contains(t, err.Error(), "bytecode too large")
	})

	t.Run("ContextCancellation", func(t *testing.T) {
		// Should respect context cancellation
		ctx, cancel := context.WithCancel(context.Background())
		cancel() // Cancel immediately

		plan, err := New(ctx, testBytecode)
		assert.Error(t, err)
		assert.Nil(t, plan)
		assert.Contains(t, err.Error(), "context canceled")
	})
}

func TestPlan_BasicProperties(t *testing.T) {
	ctx := context.Background()
	plan, err := New(ctx, testBytecode)
	require.NoError(t, err)
	defer plan.Close()

	t.Run("Bytecode", func(t *testing.T) {
		// Should return original bytecode
		bytecode := plan.Bytecode()
		assert.Equal(t, testBytecode, bytecode)
	})

	t.Run("BytecodeLength", func(t *testing.T) {
		// Should return correct length
		length := plan.BytecodeLength()
		assert.Equal(t, len(testBytecode), length)
	})

	t.Run("InstructionCount", func(t *testing.T) {
		// Should count instructions correctly (4 instructions in testBytecode)
		count := plan.InstructionCount()
		assert.Equal(t, uint32(4), count) // PUSH1, PUSH1, ADD, STOP
	})

	t.Run("ConstantCount", func(t *testing.T) {
		// Should count PUSH constants correctly (2 PUSH1 instructions)
		count := plan.ConstantCount()
		assert.Equal(t, uint32(2), count)
	})

	t.Run("HasPCMapping", func(t *testing.T) {
		// Should indicate if PC mapping is available
		hasMapping := plan.HasPCMapping()
		// For simplified plans, this might be false
		assert.False(t, hasMapping) // Expecting false for simplified implementation
	})
}

func TestPlan_JumpDestinations(t *testing.T) {
	ctx := context.Background()
	plan, err := New(ctx, jumpBytecode)
	require.NoError(t, err)
	defer plan.Close()

	t.Run("IsValidJumpDest", func(t *testing.T) {
		// PC 0: PUSH1 - not a jump destination
		assert.False(t, plan.IsValidJumpDest(0))
		
		// PC 3: STOP - not a jump destination  
		assert.False(t, plan.IsValidJumpDest(3))
		
		// PC 4: JUMPDEST - should be a valid jump destination
		assert.True(t, plan.IsValidJumpDest(4))
		
		// PC 10: Out of bounds - not a jump destination
		assert.False(t, plan.IsValidJumpDest(10))
	})

	t.Run("GetJumpDestinations", func(t *testing.T) {
		// Should return all jump destinations
		jumpDests, err := plan.GetJumpDestinations(ctx)
		require.NoError(t, err)
		assert.Len(t, jumpDests, 1)
		assert.Contains(t, jumpDests, uint32(4)) // JUMPDEST at PC 4
	})
}

func TestPlan_Constants(t *testing.T) {
	ctx := context.Background()
	plan, err := New(ctx, testBytecode)
	require.NoError(t, err)
	defer plan.Close()

	t.Run("GetConstant", func(t *testing.T) {
		// Should retrieve constants correctly
		// First constant: 0x42 from first PUSH1
		const1, err := plan.GetConstant(ctx, 0)
		require.NoError(t, err)
		expected1, _ := primitives.U256FromHex("0x42")
		assert.True(t, const1.Equal(expected1))

		// Second constant: 0x10 from second PUSH1  
		const2, err := plan.GetConstant(ctx, 1)
		require.NoError(t, err)
		expected2, _ := primitives.U256FromHex("0x10")
		assert.True(t, const2.Equal(expected2))
	})

	t.Run("GetConstantOutOfBounds", func(t *testing.T) {
		// Should handle out-of-bounds constant access
		_, err := plan.GetConstant(ctx, 99)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "out of bounds")
	})

	t.Run("GetAllConstants", func(t *testing.T) {
		// Should retrieve all constants
		constants, err := plan.GetAllConstants(ctx)
		require.NoError(t, err)
		assert.Len(t, constants, 2)
		
		// Check values
		expected1, _ := primitives.U256FromHex("0x42")
		expected2, _ := primitives.U256FromHex("0x10")
		assert.True(t, constants[0].Equal(expected1))
		assert.True(t, constants[1].Equal(expected2))
	})
}

func TestPlan_InstructionStream(t *testing.T) {
	ctx := context.Background()
	plan, err := New(ctx, testBytecode)
	require.NoError(t, err)
	defer plan.Close()

	t.Run("GetInstructionElement", func(t *testing.T) {
		// Should retrieve instruction elements
		// First instruction should be PUSH1 (0x60)
		elem, err := plan.GetInstructionElement(ctx, 0)
		require.NoError(t, err)
		assert.Equal(t, uint64(0x60), elem) // PUSH1 opcode
	})

	t.Run("GetInstructionElementOutOfBounds", func(t *testing.T) {
		// Should handle out-of-bounds access
		_, err := plan.GetInstructionElement(ctx, 999)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "out of bounds")
	})
}

func TestPlan_Statistics(t *testing.T) {
	ctx := context.Background()
	plan, err := New(ctx, jumpBytecode) // Use more complex bytecode
	require.NoError(t, err)
	defer plan.Close()

	t.Run("GetStats", func(t *testing.T) {
		// Should return comprehensive statistics
		stats, err := plan.GetStats(ctx)
		require.NoError(t, err)

		assert.Equal(t, uint32(len(jumpBytecode)), stats.BytecodeLength)
		assert.Greater(t, stats.InstructionCount, uint32(0))
		assert.Equal(t, uint32(1), stats.ConstantCount) // One PUSH1
		assert.False(t, stats.HasPCMapping)             // Simplified plan
		assert.Greater(t, stats.MemoryUsage, uint64(0)) // Should use some memory
	})
}

func TestPlan_ResourceManagement(t *testing.T) {
	ctx := context.Background()

	t.Run("Close", func(t *testing.T) {
		// Should close resources properly
		plan, err := New(ctx, testBytecode)
		require.NoError(t, err)

		// Should be able to close
		err = plan.Close()
		assert.NoError(t, err)

		// Operations after close should fail
		_, err = plan.GetConstant(ctx, 0)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "closed")
	})

	t.Run("DoubleClose", func(t *testing.T) {
		// Should handle double close gracefully
		plan, err := New(ctx, testBytecode)
		require.NoError(t, err)

		err1 := plan.Close()
		err2 := plan.Close()
		
		assert.NoError(t, err1)
		assert.NoError(t, err2) // Should not error on second close
	})
}

func TestPlan_ConcurrentAccess(t *testing.T) {
	ctx := context.Background()
	plan, err := New(ctx, testBytecode)
	require.NoError(t, err)
	defer plan.Close()

	t.Run("ConcurrentRead", func(t *testing.T) {
		// Should handle concurrent read access safely
		done := make(chan bool, 2)

		go func() {
			for i := 0; i < 100; i++ {
				bytecode := plan.Bytecode()
				assert.Equal(t, testBytecode, bytecode)
			}
			done <- true
		}()

		go func() {
			for i := 0; i < 100; i++ {
				count := plan.InstructionCount()
				assert.Equal(t, uint32(4), count)
			}
			done <- true
		}()

		<-done
		<-done
	})
}

func TestPlan_EdgeCases(t *testing.T) {
	ctx := context.Background()

	t.Run("SingleSTOPInstruction", func(t *testing.T) {
		// Should handle single STOP instruction
		stopOnly := []byte{0x00}
		plan, err := New(ctx, stopOnly)
		require.NoError(t, err)
		defer plan.Close()

		assert.Equal(t, uint32(1), plan.InstructionCount())
		assert.Equal(t, uint32(0), plan.ConstantCount()) // No PUSH instructions
	})

	t.Run("MaximumPUSH32", func(t *testing.T) {
		// Should handle PUSH32 with maximum data
		push32Data := make([]byte, 32)
		for i := range push32Data {
			push32Data[i] = 0xFF
		}
		push32Bytecode := append([]byte{0x7F}, push32Data...) // PUSH32 + data
		push32Bytecode = append(push32Bytecode, 0x00)         // + STOP

		plan, err := New(ctx, push32Bytecode)
		require.NoError(t, err)
		defer plan.Close()

		assert.Equal(t, uint32(1), plan.ConstantCount()) // One PUSH32

		// Verify the constant value
		constant, err := plan.GetConstant(ctx, 0)
		require.NoError(t, err)

		// Should be all 0xFF bytes
		expectedBytes := make([]byte, 32)
		for i := range expectedBytes {
			expectedBytes[i] = 0xFF
		}
		expected, _ := primitives.U256FromBytes(expectedBytes)
		assert.True(t, constant.Equal(expected))
	})

	t.Run("MixedPUSHSizes", func(t *testing.T) {
		// Should handle different PUSH instruction sizes
		mixedPushes := []byte{
			0x60, 0x01,             // PUSH1 0x01
			0x61, 0x02, 0x03,       // PUSH2 0x0203  
			0x62, 0x04, 0x05, 0x06, // PUSH3 0x040506
			0x00, // STOP
		}

		plan, err := New(ctx, mixedPushes)
		require.NoError(t, err)
		defer plan.Close()

		assert.Equal(t, uint32(3), plan.ConstantCount()) // Three PUSH instructions
	})
}

// Benchmark tests to ensure performance
func BenchmarkPlan_New(b *testing.B) {
	ctx := context.Background()
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		plan, err := New(ctx, testBytecode)
		if err != nil {
			b.Fatal(err)
		}
		plan.Close()
	}
}

func BenchmarkPlan_GetConstant(b *testing.B) {
	ctx := context.Background()
	plan, err := New(ctx, testBytecode)
	if err != nil {
		b.Fatal(err)
	}
	defer plan.Close()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := plan.GetConstant(ctx, 0)
		if err != nil {
			b.Fatal(err)
		}
	}
}