// @ts-nocheck
import { calculateBaseFee } from "./calculateBaseFee.js";
import { calculateExcessBlobGas } from "./calculateExcessBlobGas.js";

/**
 * Calculate next block's fee market state (standard form)
 *
 * Updates both EIP-1559 base fee and EIP-4844 blob base fee components.
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('../BrandedState.js').BrandedState} state - Current block state
 * @returns {import('../BrandedState.js').BrandedState} Next block's state
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const currentState = {
 *   gasUsed: 20_000_000n,
 *   gasLimit: 30_000_000n,
 *   baseFee: 1_000_000_000n,
 *   excessBlobGas: 0n,
 *   blobGasUsed: 262144n
 * };
 * const next = FeeMarket.nextState(currentState);
 * ```
 */
export function nextState(state) {
	const nextBaseFee = calculateBaseFee(
		state.gasUsed,
		state.gasLimit,
		state.baseFee,
	);
	const nextExcessBlobGas = calculateExcessBlobGas(
		state.excessBlobGas,
		state.blobGasUsed,
	);

	return {
		gasUsed: 0n, // Reset for next block
		gasLimit: state.gasLimit, // Typically unchanged
		baseFee: nextBaseFee,
		excessBlobGas: nextExcessBlobGas,
		blobGasUsed: 0n, // Reset for next block
	};
}
