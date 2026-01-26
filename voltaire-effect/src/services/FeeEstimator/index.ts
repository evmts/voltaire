/**
 * @fileoverview FeeEstimator module exports for gas fee calculations.
 *
 * @module FeeEstimator
 * @since 0.0.1
 *
 * @description
 * This module provides the fee estimator service for calculating transaction
 * gas fees. It includes the service definition, default layer implementation,
 * and all related types.
 *
 * Main exports:
 * - {@link FeeEstimatorService} - The service tag/interface
 * - {@link DefaultFeeEstimator} - The default implementation layer
 * - {@link makeFeeEstimator} - Factory for custom multiplier layers
 * - {@link FeeEstimationError} - Error type for failed operations
 *
 * Type exports:
 * - {@link FeeValues} - Union of fee value types
 * - {@link FeeValuesLegacy} - Legacy gasPrice fees
 * - {@link FeeValuesEIP1559} - EIP-1559 maxFeePerGas/maxPriorityFeePerGas fees
 *
 * @example Typical usage
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
 *   return yield* feeEstimator.estimateFeesPerGas('eip1559')
 * }).pipe(
 *   Effect.provide(DefaultFeeEstimator),
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 *
 * @see {@link ProviderService} - Required dependency
 */

export {
	DefaultFeeEstimator,
	makeFeeEstimator,
} from "./DefaultFeeEstimator.js";
export {
	FeeEstimationError,
	FeeEstimatorService,
	type FeeEstimatorShape,
	type FeeValues,
	type FeeValuesEIP1559,
	type FeeValuesLegacy,
} from "./FeeEstimatorService.js";
