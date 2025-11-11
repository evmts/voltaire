// @ts-nocheck
import * as Eip1559 from "../eip1559Constants.js";

/**
 * Calculate next block's base fee using EIP-1559 formula (standard form)
 *
 * Formula:
 * - gasTarget = gasLimit / 2
 * - If gasUsed > gasTarget: baseFee increases (up to 12.5%)
 * - If gasUsed < gasTarget: baseFee decreases (up to 12.5%)
 * - If gasUsed == gasTarget: baseFee stays same
 * - Always: baseFee >= MIN_BASE_FEE (7 wei)
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {bigint} parentGasUsed - Gas used in parent block
 * @param {bigint} parentGasLimit - Gas limit of parent block
 * @param {bigint} parentBaseFee - Base fee of parent block (wei)
 * @returns {bigint} Next block's base fee (wei)
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * // Block at target (50% full): base fee unchanged
 * const baseFee1 = FeeMarket.calculateBaseFee(15_000_000n, 30_000_000n, 1_000_000_000n);
 * // baseFee1 === 1_000_000_000n
 * ```
 */
export function calculateBaseFee(parentGasUsed, parentGasLimit, parentBaseFee) {
	// Target is 50% of gas limit (elasticity multiplier = 2)
	const parentGasTarget = parentGasLimit / Eip1559.ELASTICITY_MULTIPLIER;

	// Empty block: base fee stays same
	if (parentGasUsed === 0n) {
		return parentBaseFee;
	}

	// At target: base fee stays same
	if (parentGasUsed === parentGasTarget) {
		return parentBaseFee;
	}

	let newBaseFee = parentBaseFee;

	if (parentGasUsed > parentGasTarget) {
		// Block used more than target: increase base fee
		const gasUsedDelta = parentGasUsed - parentGasTarget;
		// baseFee * delta / target / 8 (max 12.5% increase)
		const baseFeeDelta =
			(parentBaseFee * gasUsedDelta) /
			parentGasTarget /
			Eip1559.BASE_FEE_CHANGE_DENOMINATOR;
		newBaseFee = parentBaseFee + (baseFeeDelta > 0n ? baseFeeDelta : 1n);
	} else {
		// Block used less than target: decrease base fee
		const gasUsedDelta = parentGasTarget - parentGasUsed;
		// baseFee * delta / target / 8 (max 12.5% decrease)
		const baseFeeDelta =
			(parentBaseFee * gasUsedDelta) /
			parentGasTarget /
			Eip1559.BASE_FEE_CHANGE_DENOMINATOR;
		const delta = baseFeeDelta > 0n ? baseFeeDelta : 1n;
		newBaseFee =
			parentBaseFee > delta ? parentBaseFee - delta : Eip1559.MIN_BASE_FEE;
	}

	// Enforce minimum base fee
	return newBaseFee < Eip1559.MIN_BASE_FEE ? Eip1559.MIN_BASE_FEE : newBaseFee;
}
