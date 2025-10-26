package primitives

import "math"

// EIP-1559 Fee Market implementation
// Base fee adjusts based on block fullness; burned, not paid to miners

// MinBaseFee is the minimum base fee in wei
const MinBaseFee uint64 = 7

// calculateFeeDelta safely calculates fee delta avoiding overflow and division by zero
func calculateFeeDelta(fee, gasDelta, gasTarget, denominator uint64) uint64 {
	// Use larger precision for intermediate calculation to avoid overflow
	// Convert to uint128-equivalent using Go's native uint64 arithmetic with checks

	// Avoid division by zero
	if gasTarget == 0 || denominator == 0 {
		divisor := uint64(1)
		// fee * gasDelta with overflow protection
		if gasDelta == 0 || fee == 0 {
			return max(1, 0)
		}
		// Check for overflow: if fee * gasDelta would overflow
		if gasDelta > math.MaxUint64/fee {
			return math.MaxUint64
		}
		intermediate := fee * gasDelta
		return max(1, intermediate/divisor)
	}

	divisor := gasTarget * denominator

	// Check for overflow in multiplication
	if gasDelta > 0 && fee > math.MaxUint64/gasDelta {
		// Would overflow, return max safe value
		return max(1, math.MaxUint64/divisor)
	}

	intermediate := fee * gasDelta
	result := intermediate / divisor

	// Always return at least 1 to ensure some movement
	return max(1, result)
}

// max returns the maximum of two uint64 values
func max(a, b uint64) uint64 {
	if a > b {
		return a
	}
	return b
}

// min returns the minimum of two uint64 values
func min(a, b uint64) uint64 {
	if a < b {
		return a
	}
	return b
}

// InitialBaseFee calculates the base fee for the first EIP-1559 block based on parent gas usage
//
// Parameters:
//   - parentGasUsed: Gas used by the parent block
//   - parentGasLimit: Gas limit of the parent block
//
// Returns:
//   - Initial base fee in wei
func InitialBaseFee(parentGasUsed, parentGasLimit uint64) uint64 {
	parentGasTarget := parentGasLimit / 2
	baseFee := BaseFeeInitial // 1 gwei

	if parentGasUsed > 0 {
		var gasUsedDelta uint64
		if parentGasUsed > parentGasTarget {
			gasUsedDelta = parentGasUsed - parentGasTarget
		} else {
			gasUsedDelta = parentGasTarget - parentGasUsed
		}

		baseFeeDelta := calculateFeeDelta(baseFee, gasUsedDelta, parentGasTarget, BaseFeeMaxChangeDenominator)

		if parentGasUsed > parentGasTarget {
			baseFee = baseFee + baseFeeDelta
		} else if baseFee > baseFeeDelta {
			baseFee = baseFee - baseFeeDelta
		}
	}

	return max(baseFee, MinBaseFee)
}

// NextBaseFee calculates the next block's base fee based on the current block
//
// This implements the EIP-1559 base fee adjustment algorithm:
// - If the block used exactly the target gas, the base fee remains the same
// - If the block used more than the target, the base fee increases
// - If the block used less than the target, the base fee decreases
// - The maximum change per block is 12.5% (1/8)
//
// Parameters:
//   - parentBaseFee: Base fee of the parent block (in wei)
//   - parentGasUsed: Gas used by the parent block
//   - parentGasTarget: Target gas usage of the parent block
//
// Returns:
//   - The next block's base fee (in wei)
func NextBaseFee(parentBaseFee, parentGasUsed, parentGasTarget uint64) uint64 {
	// If parent block is empty, keep the base fee the same
	if parentGasUsed == 0 {
		return parentBaseFee
	}

	newBaseFee := parentBaseFee

	if parentGasUsed == parentGasTarget {
		// If parent block used exactly the target gas, keep the base fee the same
		// No change needed
	} else if parentGasUsed > parentGasTarget {
		// If parent block used more than the target gas, increase the base fee
		gasUsedDelta := parentGasUsed - parentGasTarget

		// Calculate the base fee delta (max 12.5% increase)
		baseFeeDelta := calculateFeeDelta(parentBaseFee, gasUsedDelta, parentGasTarget, BaseFeeMaxChangeDenominator)

		// Increase the base fee with overflow protection
		if parentBaseFee > math.MaxUint64-baseFeeDelta {
			// Would overflow, keep at parent fee
			newBaseFee = parentBaseFee
		} else {
			newBaseFee = parentBaseFee + baseFeeDelta
		}
	} else {
		// If parent block used less than the target gas, decrease the base fee
		gasUsedDelta := parentGasTarget - parentGasUsed

		// Calculate the base fee delta (max 12.5% decrease)
		baseFeeDelta := calculateFeeDelta(parentBaseFee, gasUsedDelta, parentGasTarget, BaseFeeMaxChangeDenominator)

		// Decrease the base fee, but don't go below the minimum
		if parentBaseFee > baseFeeDelta {
			newBaseFee = parentBaseFee - baseFeeDelta
		} else {
			newBaseFee = MinBaseFee
		}
	}

	// Ensure base fee is at least the minimum
	return max(newBaseFee, MinBaseFee)
}

// EffectiveGasPriceResult contains the results of effective gas price calculation
type EffectiveGasPriceResult struct {
	EffectiveGasPrice uint64 // The effective gas price paid
	MinerFee          uint64 // The miner's portion of the fee (priority fee)
}

// GetEffectiveGasPrice calculates the effective gas price for an EIP-1559 transaction
//
// The effective gas price is the minimum of:
//  1. maxFeePerGas specified by the sender
//  2. baseFeePerGas + maxPriorityFeePerGas
//
// Parameters:
//   - baseFeePerGas: Current block's base fee
//   - maxFeePerGas: Maximum fee the sender is willing to pay
//   - maxPriorityFeePerGas: Maximum tip the sender is willing to pay to the miner
//
// Returns:
//   - The effective gas price, and the miner's portion of the fee
func GetEffectiveGasPrice(baseFeePerGas, maxFeePerGas, maxPriorityFeePerGas uint64) EffectiveGasPriceResult {
	// Ensure the transaction at least pays the base fee
	if maxFeePerGas < baseFeePerGas {
		// Transaction's max fee is less than base fee
		// In a real implementation, this transaction would be rejected
		// For now, just return the max fee and zero miner fee
		return EffectiveGasPriceResult{
			EffectiveGasPrice: maxFeePerGas,
			MinerFee:          0,
		}
	}

	// Calculate the priority fee (tip to miner)
	// This is limited by both maxPriorityFeePerGas and the leftover after base fee
	maxPriorityFee := min(maxPriorityFeePerGas, maxFeePerGas-baseFeePerGas)

	// The effective gas price is base fee plus priority fee
	effectiveGasPrice := baseFeePerGas + maxPriorityFee

	return EffectiveGasPriceResult{
		EffectiveGasPrice: effectiveGasPrice,
		MinerFee:          maxPriorityFee,
	}
}

// GetGasTarget calculates the gas target for a block
//
// The gas target is the desired gas usage per block, which is typically
// half of the maximum gas limit.
//
// Parameters:
//   - gasLimit: The block's gas limit
//
// Returns:
//   - The gas target for the block
func GetGasTarget(gasLimit uint64) uint64 {
	return gasLimit / 2
}

// CalculateNextBaseFee is a convenience function that calculates the next base fee
// given a parent gas limit instead of a pre-calculated gas target
//
// Parameters:
//   - parentBaseFee: Base fee of the parent block (in wei)
//   - parentGasUsed: Gas used by the parent block
//   - parentGasLimit: Gas limit of the parent block
//
// Returns:
//   - The next block's base fee (in wei)
func CalculateNextBaseFee(parentBaseFee, parentGasUsed, parentGasLimit uint64) uint64 {
	parentGasTarget := GetGasTarget(parentGasLimit)
	return NextBaseFee(parentBaseFee, parentGasUsed, parentGasTarget)
}

// CalculatePriorityFee calculates the priority fee (miner tip) for a transaction
//
// Parameters:
//   - maxFeePerGas: Maximum fee per gas willing to pay
//   - baseFee: Current block's base fee
//   - maxPriorityFeePerGas: Maximum priority fee per gas
//
// Returns:
//   - Actual priority fee per gas
func CalculatePriorityFee(maxFeePerGas, baseFee, maxPriorityFeePerGas uint64) uint64 {
	if maxFeePerGas < baseFee {
		return 0
	}

	maxPriorityFee := maxFeePerGas - baseFee
	return min(maxPriorityFee, maxPriorityFeePerGas)
}
