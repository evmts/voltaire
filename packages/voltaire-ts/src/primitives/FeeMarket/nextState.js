// @ts-nocheck
import { BaseFee } from "./BaseFee.js";
import {
	calculateExcessBlobGas,
	calculateExcessBlobGasEip7918,
} from "./calculateExcessBlobGas.js";
import { resolveBlobContext } from "./resolveBlobContext.js";

/**
 * Calculate next block's fee market state (standard form)
 *
 * Updates both EIP-1559 base fee and EIP-4844 blob base fee components.
 *
 * Without `context`, blob gas uses the Cancun schedule (backwards compatible).
 * With `context`, the schedule comes from `schedule` > `timestamp` >
 * `hardfork`, and on Osaka+ (Osaka, BPO1, BPO2, later) the EIP-7918 reserve
 * price uses `state.baseFee` as the parent base fee per gas.
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('./FeeMarketType.js').FeeMarketType} state - Current block state
 * @param {import('./BlobScheduleType.js').BlobForkContext} [context] - Optional fork, timestamp, or schedule context
 * @returns {import('./FeeMarketType.js').FeeMarketType} Next block's state
 * @throws {InvalidRangeError} If `context` names an unknown or pre-Cancun fork, or an invalid schedule
 * @throws {InvalidFormatError} If `context.timestamp` is an invalid number
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
 * // BPO2 (target 14, max 21 blobs) with EIP-7918
 * const nextBpo2 = FeeMarket.nextState(currentState, { hardfork: 'bpo2' });
 * ```
 */
export function nextState(state, context) {
	const nextBaseFee = BaseFee(state.gasUsed, state.gasLimit, state.baseFee);
	let nextExcessBlobGas;
	if (context === undefined) {
		nextExcessBlobGas = calculateExcessBlobGas(
			state.excessBlobGas,
			state.blobGasUsed,
		);
	} else {
		const { schedule, reservePrice } = resolveBlobContext(context);
		nextExcessBlobGas = reservePrice
			? calculateExcessBlobGasEip7918(
					state.excessBlobGas,
					state.blobGasUsed,
					state.baseFee,
					schedule,
				)
			: calculateExcessBlobGas(state.excessBlobGas, state.blobGasUsed, {
					schedule,
					reservePrice: false,
				});
	}

	return {
		gasUsed: 0n, // Reset for next block
		gasLimit: state.gasLimit, // Typically unchanged
		baseFee: nextBaseFee,
		excessBlobGas: nextExcessBlobGas,
		blobGasUsed: 0n, // Reset for next block
	};
}
