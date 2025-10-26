package primitives

import (
	"math"
	"testing"
)

func TestCalculateFeeDelta(t *testing.T) {
	tests := []struct {
		name        string
		fee         uint64
		gasDelta    uint64
		gasTarget   uint64
		denominator uint64
		expected    uint64
	}{
		{
			name:        "basic calculation",
			fee:         1000,
			gasDelta:    100,
			gasTarget:   1000,
			denominator: 8,
			expected:    12, // (1000 * 100) / (1000 * 8) = 12.5 -> 12
		},
		{
			name:        "returns at least 1",
			fee:         1,
			gasDelta:    1,
			gasTarget:   1000000,
			denominator: 1000000,
			expected:    1,
		},
		{
			name:        "zero gas delta",
			fee:         1000,
			gasDelta:    0,
			gasTarget:   1000,
			denominator: 8,
			expected:    1, // Always returns at least 1
		},
		{
			name:        "zero gas target protection",
			fee:         1000,
			gasDelta:    100,
			gasTarget:   0,
			denominator: 8,
			expected:    100000, // Uses divisor of 1
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calculateFeeDelta(tt.fee, tt.gasDelta, tt.gasTarget, tt.denominator)
			if result != tt.expected {
				t.Errorf("calculateFeeDelta() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestInitialBaseFee(t *testing.T) {
	tests := []struct {
		name            string
		parentGasUsed   uint64
		parentGasLimit  uint64
		expectedApprox  uint64 // Approximate expected value
		checkMinBaseFee bool
	}{
		{
			name:           "zero gas usage",
			parentGasUsed:  0,
			parentGasLimit: 30000000,
			expectedApprox: 1000000000, // 1 gwei
		},
		{
			name:           "exactly target gas usage",
			parentGasUsed:  15000000,
			parentGasLimit: 30000000,
			expectedApprox: 999999999, // Slightly below 1 gwei due to delta calculation
		},
		{
			name:           "above target gas usage",
			parentGasUsed:  20000000,
			parentGasLimit: 30000000,
			expectedApprox: 1041666666, // Above 1 gwei
		},
		{
			name:           "below target gas usage",
			parentGasUsed:  10000000,
			parentGasLimit: 30000000,
			expectedApprox: 958333334, // Below 1 gwei
		},
		{
			name:            "respects minimum base fee",
			parentGasUsed:   0,
			parentGasLimit:  100,
			checkMinBaseFee: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := InitialBaseFee(tt.parentGasUsed, tt.parentGasLimit)

			if tt.checkMinBaseFee {
				if result < MinBaseFee {
					t.Errorf("InitialBaseFee() = %v, should be >= MinBaseFee (%v)", result, MinBaseFee)
				}
			} else if result != tt.expectedApprox {
				t.Errorf("InitialBaseFee() = %v, want %v", result, tt.expectedApprox)
			}
		})
	}
}

func TestNextBaseFee(t *testing.T) {
	tests := []struct {
		name            string
		parentBaseFee   uint64
		parentGasUsed   uint64
		parentGasTarget uint64
		expected        uint64
	}{
		{
			name:            "exactly target gas usage",
			parentBaseFee:   1000000000,
			parentGasUsed:   15000000,
			parentGasTarget: 15000000,
			expected:        1000000000, // No change
		},
		{
			name:            "above target gas usage",
			parentBaseFee:   1000000000,
			parentGasUsed:   20000000,
			parentGasTarget: 15000000,
			expected:        1041666666, // Increase
		},
		{
			name:            "below target gas usage",
			parentBaseFee:   1000000000,
			parentGasUsed:   10000000,
			parentGasTarget: 15000000,
			expected:        958333334, // Decrease
		},
		{
			name:            "full block (maximum increase)",
			parentBaseFee:   1000000000,
			parentGasUsed:   30000000,
			parentGasTarget: 15000000,
			expected:        1125000000, // 12.5% increase
		},
		{
			name:            "empty block",
			parentBaseFee:   1000000000,
			parentGasUsed:   0,
			parentGasTarget: 15000000,
			expected:        1000000000, // No change for empty blocks
		},
		{
			name:            "respects minimum base fee",
			parentBaseFee:   10,
			parentGasUsed:   0,
			parentGasTarget: 15000000,
			expected:        10, // Stays at parent fee
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := NextBaseFee(tt.parentBaseFee, tt.parentGasUsed, tt.parentGasTarget)
			if result != tt.expected {
				t.Errorf("NextBaseFee() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestGetEffectiveGasPrice(t *testing.T) {
	tests := []struct {
		name                  string
		baseFeePerGas         uint64
		maxFeePerGas          uint64
		maxPriorityFeePerGas  uint64
		expectedEffective     uint64
		expectedMinerFee      uint64
	}{
		{
			name:                 "sufficient max fee",
			baseFeePerGas:        1000000000, // 1 gwei
			maxFeePerGas:         2000000000, // 2 gwei
			maxPriorityFeePerGas: 500000000,  // 0.5 gwei
			expectedEffective:    1500000000, // 1.5 gwei
			expectedMinerFee:     500000000,  // 0.5 gwei
		},
		{
			name:                 "limited max fee",
			baseFeePerGas:        1000000000, // 1 gwei
			maxFeePerGas:         1200000000, // 1.2 gwei
			maxPriorityFeePerGas: 500000000,  // 0.5 gwei (more than available)
			expectedEffective:    1200000000, // 1.2 gwei
			expectedMinerFee:     200000000,  // 0.2 gwei (limited by max fee)
		},
		{
			name:                 "max fee below base fee",
			baseFeePerGas:        1000000000, // 1 gwei
			maxFeePerGas:         800000000,  // 0.8 gwei (below base)
			maxPriorityFeePerGas: 100000000,  // 0.1 gwei
			expectedEffective:    800000000,  // 0.8 gwei
			expectedMinerFee:     0,          // No priority fee
		},
		{
			name:                 "zero priority fee",
			baseFeePerGas:        1000000000, // 1 gwei
			maxFeePerGas:         2000000000, // 2 gwei
			maxPriorityFeePerGas: 0,          // No tip
			expectedEffective:    1000000000, // 1 gwei (base fee only)
			expectedMinerFee:     0,
		},
		{
			name:                 "exact base fee",
			baseFeePerGas:        1000000000, // 1 gwei
			maxFeePerGas:         1000000000, // Exactly base fee
			maxPriorityFeePerGas: 100000000,  // 0.1 gwei (can't be paid)
			expectedEffective:    1000000000, // 1 gwei
			expectedMinerFee:     0,          // No room for priority
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GetEffectiveGasPrice(tt.baseFeePerGas, tt.maxFeePerGas, tt.maxPriorityFeePerGas)
			if result.EffectiveGasPrice != tt.expectedEffective {
				t.Errorf("EffectiveGasPrice = %v, want %v", result.EffectiveGasPrice, tt.expectedEffective)
			}
			if result.MinerFee != tt.expectedMinerFee {
				t.Errorf("MinerFee = %v, want %v", result.MinerFee, tt.expectedMinerFee)
			}
		})
	}
}

func TestGetGasTarget(t *testing.T) {
	tests := []struct {
		name     string
		gasLimit uint64
		expected uint64
	}{
		{
			name:     "standard gas limit",
			gasLimit: 30000000,
			expected: 15000000,
		},
		{
			name:     "odd gas limit",
			gasLimit: 30000001,
			expected: 15000000, // Integer division rounds down
		},
		{
			name:     "zero gas limit",
			gasLimit: 0,
			expected: 0,
		},
		{
			name:     "small gas limit",
			gasLimit: 1,
			expected: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GetGasTarget(tt.gasLimit)
			if result != tt.expected {
				t.Errorf("GetGasTarget() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestCalculateNextBaseFee(t *testing.T) {
	tests := []struct {
		name            string
		parentBaseFee   uint64
		parentGasUsed   uint64
		parentGasLimit  uint64
		expected        uint64
	}{
		{
			name:           "at target",
			parentBaseFee:  1000000000,
			parentGasUsed:  15000000,
			parentGasLimit: 30000000,
			expected:       1000000000,
		},
		{
			name:           "above target",
			parentBaseFee:  1000000000,
			parentGasUsed:  20000000,
			parentGasLimit: 30000000,
			expected:       1041666666,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CalculateNextBaseFee(tt.parentBaseFee, tt.parentGasUsed, tt.parentGasLimit)
			if result != tt.expected {
				t.Errorf("CalculateNextBaseFee() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestCalculatePriorityFee(t *testing.T) {
	tests := []struct {
		name                 string
		maxFeePerGas         uint64
		baseFee              uint64
		maxPriorityFeePerGas uint64
		expected             uint64
	}{
		{
			name:                 "priority fee available",
			maxFeePerGas:         2000000000,
			baseFee:              1000000000,
			maxPriorityFeePerGas: 500000000,
			expected:             500000000,
		},
		{
			name:                 "limited by max fee",
			maxFeePerGas:         1200000000,
			baseFee:              1000000000,
			maxPriorityFeePerGas: 500000000,
			expected:             200000000,
		},
		{
			name:                 "max fee below base fee",
			maxFeePerGas:         800000000,
			baseFee:              1000000000,
			maxPriorityFeePerGas: 500000000,
			expected:             0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CalculatePriorityFee(tt.maxFeePerGas, tt.baseFee, tt.maxPriorityFeePerGas)
			if result != tt.expected {
				t.Errorf("CalculatePriorityFee() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestNextBaseFeeSequences(t *testing.T) {
	t.Run("sequence of full blocks", func(t *testing.T) {
		currentFee := uint64(1000000000)
		gasTarget := uint64(15000000)
		gasUsed := uint64(30000000) // Full block

		// After 10 full blocks, fee should compound
		for i := 0; i < 10; i++ {
			next := NextBaseFee(currentFee, gasUsed, gasTarget)
			if next <= currentFee {
				t.Errorf("Block %d: fee did not increase, got %v, previous %v", i, next, currentFee)
			}
			currentFee = next
		}

		// Fee should be significantly higher
		if currentFee <= 3000000000 {
			t.Errorf("After 10 full blocks, fee = %v, want > 3000000000", currentFee)
		}
	})

	t.Run("sequence of empty blocks", func(t *testing.T) {
		currentFee := uint64(1000000000)
		gasTarget := uint64(15000000)
		gasUsed := uint64(0) // Empty block

		// After 10 empty blocks, fee should stay the same
		for i := 0; i < 10; i++ {
			next := NextBaseFee(currentFee, gasUsed, gasTarget)
			if next != currentFee {
				t.Errorf("Block %d: fee changed, got %v, want %v", i, next, currentFee)
			}
			currentFee = next
		}

		if currentFee != 1000000000 {
			t.Errorf("After 10 empty blocks, fee = %v, want 1000000000", currentFee)
		}
	})

	t.Run("descending to minimum", func(t *testing.T) {
		currentFee := uint64(1000000000)
		gasTarget := uint64(15000000)
		gasUsed := uint64(100) // Very low usage

		// Keep decreasing until we hit minimum
		for i := 0; i < 1000; i++ {
			next := NextBaseFee(currentFee, gasUsed, gasTarget)
			if next == MinBaseFee && currentFee == MinBaseFee {
				break // Reached minimum
			}
			currentFee = next
		}

		// Should eventually reach or approach minimum
		if currentFee > 10000 {
			t.Errorf("After many low-usage blocks, fee = %v, should be much lower (closer to MinBaseFee %v)", currentFee, MinBaseFee)
		}
	})
}

func TestOverflowProtection(t *testing.T) {
	t.Run("next base fee with near-max value", func(t *testing.T) {
		parentBaseFee := uint64(math.MaxUint64 - 1000)
		gasTarget := uint64(15000000)
		gasUsed := uint64(30000000) // Would increase

		result := NextBaseFee(parentBaseFee, gasUsed, gasTarget)
		// Should handle overflow gracefully and not crash
		if result < parentBaseFee {
			t.Errorf("NextBaseFee with near-max value decreased: %v -> %v", parentBaseFee, result)
		}
	})

	t.Run("calculate fee delta with large values", func(t *testing.T) {
		fee := uint64(math.MaxUint64 / 2)
		gasDelta := uint64(1000)
		gasTarget := uint64(1000)
		denominator := uint64(1)

		result := calculateFeeDelta(fee, gasDelta, gasTarget, denominator)
		// Should not panic and return a valid result
		if result == 0 {
			t.Errorf("calculateFeeDelta with large values returned 0")
		}
	})
}

func TestEdgeCases(t *testing.T) {
	t.Run("minimal above-target usage", func(t *testing.T) {
		parentBaseFee := uint64(1000000000)
		gasTarget := uint64(15000000)
		gasUsed := uint64(15000001) // Just 1 over target

		result := NextBaseFee(parentBaseFee, gasUsed, gasTarget)
		if result <= parentBaseFee {
			t.Errorf("Minimal increase should still increase, got %v, want > %v", result, parentBaseFee)
		}
		if result-parentBaseFee < 1 {
			t.Errorf("Minimal increase should be at least 1, got delta %v", result-parentBaseFee)
		}
	})

	t.Run("minimal below-target usage", func(t *testing.T) {
		parentBaseFee := uint64(1000000000)
		gasTarget := uint64(15000000)
		gasUsed := uint64(14999999) // Just 1 under target

		result := NextBaseFee(parentBaseFee, gasUsed, gasTarget)
		if result >= parentBaseFee {
			t.Errorf("Minimal decrease should still decrease, got %v, want < %v", result, parentBaseFee)
		}
		if parentBaseFee-result < 1 {
			t.Errorf("Minimal decrease should be at least 1, got delta %v", parentBaseFee-result)
		}
	})

	t.Run("decrease to minimum boundary", func(t *testing.T) {
		parentBaseFee := uint64(8) // Just above MinBaseFee
		gasTarget := uint64(1000)
		gasUsed := uint64(1) // Very low to force decrease

		result := NextBaseFee(parentBaseFee, gasUsed, gasTarget)
		if result < MinBaseFee {
			t.Errorf("NextBaseFee should not go below MinBaseFee, got %v", result)
		}
		if result != MinBaseFee {
			t.Errorf("NextBaseFee at boundary should hit MinBaseFee, got %v, want %v", result, MinBaseFee)
		}
	})
}
