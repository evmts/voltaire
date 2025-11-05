// @ts-nocheck
import { nextState } from "./nextState.js";

/**
 * Calculate series of future base fees (standard form)
 *
 * Useful for estimating fee trends over multiple blocks.
 *
 * @param {import('../BrandedState.js').BrandedState} initialState - Starting state
 * @param {number} blocks - Number of blocks to project
 * @param {bigint} avgGasUsed - Average gas used per block
 * @param {bigint} [avgBlobGasUsed=0n] - Average blob gas used per block
 * @returns {bigint[]} Array of future base fees
 *
 * @example
 * ```typescript
 * const fees = projectBaseFees(
 *   { gasUsed: 15_000_000n, gasLimit: 30_000_000n, baseFee: 1_000_000_000n,
 *     excessBlobGas: 0n, blobGasUsed: 0n },
 *   10, // next 10 blocks
 *   25_000_000n, // expect 83% full blocks
 *   262144n // expect 2 blobs per block
 * );
 * // fees.length === 10
 * // fees show increasing trend (above target usage)
 * ```
 */
export function projectBaseFees(
	initialState,
	blocks,
	avgGasUsed,
	avgBlobGasUsed = 0n,
) {
	const fees = [];
	let state = { ...initialState };

	for (let i = 0; i < blocks; i++) {
		// Simulate block with average usage
		state = {
			...state,
			gasUsed: avgGasUsed,
			blobGasUsed: avgBlobGasUsed,
		};

		// Calculate next state
		state = nextState(state);
		fees.push(state.baseFee);
	}

	return fees;
}
