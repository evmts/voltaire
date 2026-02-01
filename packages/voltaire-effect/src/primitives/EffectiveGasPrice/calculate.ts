/**
 * @fileoverview Pure function to calculate effective gas price.
 * @module EffectiveGasPrice/calculate
 * @since 0.1.0
 */

import type { EffectiveGasPriceType } from "./BigInt.js";

/**
 * Calculates effective gas price from EIP-1559 parameters.
 * Returns min(baseFee + priorityFee, maxFeePerGas).
 *
 * @param baseFee - Block base fee in wei
 * @param priorityFee - Max priority fee per gas in wei
 * @param maxFeePerGas - Max fee per gas in wei
 * @returns Calculated effective gas price
 *
 * @example
 * ```typescript
 * import * as EffectiveGasPrice from 'voltaire-effect/primitives/EffectiveGasPrice'
 *
 * const baseFee = 20n * 10n**9n        // 20 gwei
 * const priorityFee = 2n * 10n**9n     // 2 gwei
 * const maxFee = 30n * 10n**9n         // 30 gwei
 *
 * const effective = EffectiveGasPrice.calculate(baseFee, priorityFee, maxFee)
 * // effective = 22 gwei (baseFee + priorityFee < maxFee)
 * ```
 *
 * @since 0.1.0
 */
export const calculate = (
	baseFee: bigint,
	priorityFee: bigint,
	maxFeePerGas: bigint,
): EffectiveGasPriceType => {
	const sum = baseFee + priorityFee;
	return (sum > maxFeePerGas ? maxFeePerGas : sum) as EffectiveGasPriceType;
};
