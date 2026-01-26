/**
 * @fileoverview Default implementation of FeeEstimatorService.
 *
 * @module DefaultFeeEstimator
 * @since 0.0.1
 *
 * @description
 * Provides the default implementation layer for FeeEstimatorService.
 * Uses ProviderService to fetch gas prices and block data for fee estimation.
 *
 * For legacy transactions: uses eth_gasPrice
 * For EIP-1559 transactions: uses block baseFeePerGas + eth_maxPriorityFeePerGas
 *
 * @see {@link FeeEstimatorService} - The service interface
 * @see {@link ProviderService} - Required dependency
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ProviderService } from "../Provider/index.js";
import {
	FeeEstimationError,
	FeeEstimatorService,
	type FeeValues,
	type FeeValuesEIP1559,
	type FeeValuesLegacy,
} from "./FeeEstimatorService.js";

/**
 * Default base fee multiplier (1.2 = 20% buffer).
 *
 * @description
 * Applied to baseFeePerGas when calculating maxFeePerGas to account
 * for potential base fee increases between estimation and inclusion.
 */
const DEFAULT_BASE_FEE_MULTIPLIER = 1.2;

/**
 * Precision for bigint arithmetic (100 = 2 decimal places).
 */
const MULTIPLIER_PRECISION = 100n;
const MULTIPLIER_PRECISION_NUMBER = 100;

/**
 * Sanity limit for gas price values (1 ETH per gas).
 */
const MAX_REASONABLE_GAS_PRICE_WEI = 1_000_000_000_000_000_000n;

const ensureReasonableGasPrice = (
	value: bigint,
	label: string,
): Effect.Effect<bigint, FeeEstimationError> => {
	if (value < 0n) {
		return Effect.fail(
			new FeeEstimationError({
				message: `${label} cannot be negative (${value} wei)`,
			}),
		);
	}
	if (value > MAX_REASONABLE_GAS_PRICE_WEI) {
		return Effect.fail(
			new FeeEstimationError({
				message: `${label} exceeds maximum reasonable gas price (${value} wei)`,
			}),
		);
	}
	return Effect.succeed(value);
};

const multiplyBaseFee = (
	baseFee: bigint,
	multiplierNumerator: bigint,
): bigint => {
	const product = baseFee * multiplierNumerator;
	return (product + MULTIPLIER_PRECISION - 1n) / MULTIPLIER_PRECISION;
};

/**
 * Creates the default fee estimator implementation.
 *
 * @param baseFeeMultiplier - Multiplier for base fee (default: 1.2)
 * @returns Layer providing FeeEstimatorService
 *
 * @internal
 */
const makeDefaultFeeEstimator = (
	baseFeeMultiplier: number = DEFAULT_BASE_FEE_MULTIPLIER,
): Layer.Layer<FeeEstimatorService, never, ProviderService> =>
	Layer.effect(
		FeeEstimatorService,
		Effect.gen(function* () {
			const provider = yield* ProviderService;
			const multiplierNumerator = BigInt(
				Math.round(baseFeeMultiplier * MULTIPLIER_PRECISION_NUMBER),
			);

			const estimateLegacy = (): Effect.Effect<
				FeeValuesLegacy,
				FeeEstimationError,
				ProviderService
			> =>
				Effect.gen(function* () {
					const gasPrice = yield* provider.getGasPrice().pipe(
						Effect.mapError(
							(e) =>
								new FeeEstimationError({
									message: `Failed to get gas price: ${e.message}`,
									cause: e,
								}),
						),
					);
					const validatedGasPrice = yield* ensureReasonableGasPrice(
						gasPrice,
						"Gas price",
					);
					return { gasPrice: validatedGasPrice };
				});

			const estimateEIP1559 = (): Effect.Effect<
				FeeValuesEIP1559,
				FeeEstimationError,
				ProviderService
			> =>
				Effect.gen(function* () {
					const [block, priorityFee] = yield* Effect.all([
						provider.getBlock({ blockTag: "latest" }).pipe(
							Effect.mapError(
								(e) =>
									new FeeEstimationError({
										message: `Failed to get latest block: ${e.message}`,
										cause: e,
									}),
							),
						),
						provider.getMaxPriorityFeePerGas().pipe(
							Effect.mapError(
								(e) =>
									new FeeEstimationError({
										message: `Failed to get max priority fee: ${e.message}`,
										cause: e,
									}),
							),
						),
					]);

					const baseFeeHex = block.baseFeePerGas;
					if (!baseFeeHex) {
						return yield* Effect.fail(
							new FeeEstimationError({
								message:
									"Block does not have baseFeePerGas (pre-EIP-1559 chain)",
							}),
						);
					}

					const baseFee = BigInt(baseFeeHex);
					const validatedBaseFee = yield* ensureReasonableGasPrice(
						baseFee,
						"Base fee per gas",
					);
					const validatedPriorityFee = yield* ensureReasonableGasPrice(
						priorityFee,
						"Max priority fee per gas",
					);
					const multipliedBaseFee = multiplyBaseFee(
						validatedBaseFee,
						multiplierNumerator,
					);
					const maxFeePerGas = multipliedBaseFee + validatedPriorityFee;
					const validatedMaxFee = yield* ensureReasonableGasPrice(
						maxFeePerGas,
						"Max fee per gas",
					);

					return {
						maxFeePerGas: validatedMaxFee,
						maxPriorityFeePerGas: validatedPriorityFee,
					};
				});

			return {
				estimateFeesPerGas: (
					type: "legacy" | "eip1559",
				): Effect.Effect<FeeValues, FeeEstimationError, ProviderService> =>
					type === "legacy" ? estimateLegacy() : estimateEIP1559(),

				getMaxPriorityFeePerGas: () =>
					provider.getMaxPriorityFeePerGas().pipe(
						Effect.mapError(
							(e) =>
								new FeeEstimationError({
									message: `Failed to get max priority fee: ${e.message}`,
									cause: e,
								}),
						),
						Effect.flatMap((priorityFee) =>
							ensureReasonableGasPrice(
								priorityFee,
								"Max priority fee per gas",
							),
						),
					),

				baseFeeMultiplier,
			};
		}),
	);

/**
 * Default fee estimator layer.
 *
 * @description
 * Provides the default implementation of FeeEstimatorService with a
 * 1.2x base fee multiplier.
 *
 * Requires ProviderService in context.
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
 *   return yield* feeEstimator.estimateFeesPerGas('eip1559')
 * }).pipe(
 *   Effect.provide(DefaultFeeEstimator),
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 *
 * @see {@link FeeEstimatorService} - The service interface
 * @see {@link ProviderService} - Required dependency
 */
export const DefaultFeeEstimator: Layer.Layer<
	FeeEstimatorService,
	never,
	ProviderService
> = makeDefaultFeeEstimator();

/**
 * Creates a fee estimator layer with a custom base fee multiplier.
 *
 * @param baseFeeMultiplier - Custom multiplier for base fee calculation
 * @returns Layer providing FeeEstimatorService with custom multiplier
 *
 * @since 0.0.1
 *
 * @example Using custom multiplier
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   FeeEstimatorService,
 *   makeFeeEstimator,
 *   Provider,
 *   HttpTransport
 * } from 'voltaire-effect/services'
 *
 * // Use 1.5x multiplier for more volatile networks
 * const CustomFeeEstimator = makeFeeEstimator(1.5)
 *
 * const program = Effect.gen(function* () {
 *   const feeEstimator = yield* FeeEstimatorService
 *   return yield* feeEstimator.estimateFeesPerGas('eip1559')
 * }).pipe(
 *   Effect.provide(CustomFeeEstimator),
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 */
export const makeFeeEstimator = makeDefaultFeeEstimator;
