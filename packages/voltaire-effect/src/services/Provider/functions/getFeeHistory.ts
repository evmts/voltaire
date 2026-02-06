/**
 * @fileoverview Free function to get fee history.
 *
 * @module Provider/functions/getFeeHistory
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { BlockTag, FeeHistoryType } from "../types.js";
import { ProviderValidationError } from "../types.js";
import type { TransportError } from "../../Transport/TransportError.js";
import type { ProviderResponseError } from "../types.js";

/**
 * Gets the fee history for a range of blocks.
 *
 * @param blockCount - Number of blocks to return (must be > 0)
 * @param newestBlock - Newest block to include
 * @param rewardPercentiles - Percentiles to sample for priority fees (0-100, ascending)
 * @returns Effect yielding the fee history
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getFeeHistory, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const history = yield* getFeeHistory(10, 'latest', [25, 50, 75])
 *   console.log('Oldest block:', history.oldestBlock)
 *   console.log('Base fees:', history.baseFeePerGas)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getFeeHistory = (
	blockCount: number,
	newestBlock: BlockTag,
	rewardPercentiles: number[],
): Effect.Effect<
	FeeHistoryType,
	TransportError | ProviderResponseError | ProviderValidationError,
	ProviderService
> =>
	Effect.gen(function* () {
		if (blockCount <= 0) {
			return yield* Effect.fail(
				new ProviderValidationError(
					{ blockCount, newestBlock, rewardPercentiles },
					"blockCount must be greater than 0",
				),
			);
		}

		for (let i = 0; i < rewardPercentiles.length; i++) {
			const p = rewardPercentiles[i];
			if (p < 0 || p > 100) {
				return yield* Effect.fail(
					new ProviderValidationError(
						{ blockCount, newestBlock, rewardPercentiles },
						`Percentile ${p} must be between 0 and 100`,
					),
				);
			}
			if (i > 0 && p < rewardPercentiles[i - 1]) {
				return yield* Effect.fail(
					new ProviderValidationError(
						{ blockCount, newestBlock, rewardPercentiles },
						"Percentiles must be in ascending order",
					),
				);
			}
		}

		const svc = yield* ProviderService;
		return yield* svc.request<FeeHistoryType>("eth_feeHistory", [
			`0x${blockCount.toString(16)}`,
			newestBlock,
			rewardPercentiles,
		]);
	});
