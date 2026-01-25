/**
 * @fileoverview Fee estimator service definition for gas fee calculations.
 *
 * @module FeeEstimatorService
 * @since 0.0.1
 *
 * @description
 * The FeeEstimatorService provides methods for estimating gas fees for transactions.
 * It supports both legacy (gasPrice) and EIP-1559 (maxFeePerGas, maxPriorityFeePerGas)
 * fee models.
 *
 * The service requires a ProviderService for fetching blockchain data.
 *
 * @see {@link DefaultFeeEstimator} - The default implementation layer
 * @see {@link ProviderService} - Required dependency
 */

import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";
import type { ProviderService } from "../Provider/index.js";

/**
 * Legacy fee values using a single gasPrice.
 *
 * @description
 * Used for pre-EIP-1559 transactions where a single gas price is bid.
 *
 * @since 0.0.1
 */
export type FeeValuesLegacy = {
	readonly gasPrice: bigint;
};

/**
 * EIP-1559 fee values with base fee and priority fee.
 *
 * @description
 * Used for EIP-1559 transactions with dynamic base fees and priority tips.
 * - maxFeePerGas: Maximum total fee per gas unit willing to pay
 * - maxPriorityFeePerGas: Maximum priority fee (tip) per gas unit
 *
 * @since 0.0.1
 */
export type FeeValuesEIP1559 = {
	readonly maxFeePerGas: bigint;
	readonly maxPriorityFeePerGas: bigint;
};

/**
 * Union of legacy and EIP-1559 fee values.
 *
 * @since 0.0.1
 */
export type FeeValues = FeeValuesLegacy | FeeValuesEIP1559;

/**
 * Error thrown when fee estimation fails.
 *
 * @description
 * Contains a message and optional cause for debugging.
 *
 * @since 0.0.1
 *
 * @example Handling FeeEstimationError
 * ```typescript
 * import { Effect } from 'effect'
 * import { FeeEstimatorService, FeeEstimationError } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const feeEstimator = yield* FeeEstimatorService
 *   return yield* feeEstimator.estimateFeesPerGas('eip1559')
 * }).pipe(
 *   Effect.catchTag('FeeEstimationError', (error) => {
 *     console.error('Fee estimation failed:', error.message)
 *     return Effect.succeed({ maxFeePerGas: 0n, maxPriorityFeePerGas: 0n })
 *   })
 * )
 * ```
 */
export class FeeEstimationError extends Data.TaggedError("FeeEstimationError")<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Shape of the fee estimator service.
 *
 * @since 0.0.1
 */
export type FeeEstimatorShape = {
	/**
	 * Estimates fee values for a transaction.
	 *
	 * @param type - The fee type: "legacy" for gasPrice, "eip1559" for maxFeePerGas/maxPriorityFeePerGas
	 * @returns Effect containing the estimated fee values
	 */
	readonly estimateFeesPerGas: (
		type: "legacy" | "eip1559",
	) => Effect.Effect<FeeValues, FeeEstimationError, ProviderService>;

	/**
	 * Gets the current max priority fee per gas (EIP-1559 tip).
	 *
	 * @returns Effect containing the priority fee in wei
	 */
	readonly getMaxPriorityFeePerGas: () => Effect.Effect<
		bigint,
		FeeEstimationError,
		ProviderService
	>;

	/**
	 * Multiplier applied to base fee when calculating maxFeePerGas.
	 * Default is 1.2 (20% buffer for base fee fluctuation).
	 */
	readonly baseFeeMultiplier: number;
};

/**
 * Fee estimator service for gas fee calculations.
 *
 * @description
 * Provides methods for estimating transaction fees for both legacy and EIP-1559
 * transaction types. Uses ProviderService to fetch current gas prices and block data.
 *
 * The service applies a configurable multiplier to the base fee when calculating
 * EIP-1559 fees to account for base fee fluctuation between estimation and inclusion.
 *
 * @since 0.0.1
 *
 * @example Basic usage
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   FeeEstimatorService,
 *   DefaultFeeEstimator,
 *   Provider,
 *   HttpTransport
 * } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const feeEstimator = yield* FeeEstimatorService
 *
 *   // Get EIP-1559 fees
 *   const fees = yield* feeEstimator.estimateFeesPerGas('eip1559')
 *   console.log('Max fee:', fees.maxFeePerGas)
 *   console.log('Priority fee:', fees.maxPriorityFeePerGas)
 *
 *   // Get legacy gas price
 *   const legacyFees = yield* feeEstimator.estimateFeesPerGas('legacy')
 *   console.log('Gas price:', legacyFees.gasPrice)
 *
 *   return fees
 * }).pipe(
 *   Effect.provide(DefaultFeeEstimator),
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 *
 * @see {@link DefaultFeeEstimator} - The default implementation layer
 * @see {@link ProviderService} - Required dependency
 */
export class FeeEstimatorService extends Context.Tag("FeeEstimatorService")<
	FeeEstimatorService,
	FeeEstimatorShape
>() {}
