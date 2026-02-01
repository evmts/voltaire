/**
 * @fileoverview Effect Schema definitions for FeeOracle primitive type.
 * Provides validation for gas fee estimation data.
 * @module FeeOracle/FeeOracleSchema
 * @since 0.0.1
 */

import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Validated fee oracle data type.
 *
 * @description
 * Contains recommended fee parameters for EIP-1559 transactions.
 * All fee values are in wei.
 *
 * Properties:
 * - baseFee: Current base fee from the latest block
 * - priorityFee: Recommended tip for validators
 * - maxFee: Recommended maximum fee (should be ≥ baseFee + priorityFee)
 * - gasPrice: Legacy gas price (optional, for legacy transactions)
 * - estimatedTime: Expected seconds until inclusion (optional)
 *
 * @example
 * ```typescript
 * import * as FeeOracle from 'voltaire-effect/primitives/FeeOracle'
 * import { Effect } from 'effect'
 *
 * // From fee estimation service
 * const fees = Effect.runSync(FeeOracle.from({
 *   baseFee: 20_000_000_000n,     // 20 gwei
 *   priorityFee: 2_000_000_000n,  // 2 gwei
 *   maxFee: 50_000_000_000n,      // 50 gwei
 *   estimatedTime: 12             // ~12 seconds
 * }))
 *
 * // Validate the fee parameters
 * Effect.runSync(FeeOracle.validate(fees))
 *
 * // Get effective price for cost calculation
 * const effective = Effect.runSync(FeeOracle.effectiveGasPrice(fees))
 * ```
 *
 * @see {@link effectiveGasPrice} to calculate effective price
 * @see {@link validate} to verify fee parameters
 * @since 0.0.1
 */
export type FeeOracleType = {
	readonly baseFee: bigint;
	readonly priorityFee: bigint;
	readonly maxFee: bigint;
	readonly gasPrice?: bigint;
	readonly estimatedTime?: number;
};

const FeeOracleTypeSchema = S.declare<FeeOracleType>(
	(u): u is FeeOracleType =>
		u !== null &&
		typeof u === "object" &&
		"baseFee" in u &&
		"priorityFee" in u &&
		"maxFee" in u,
	{ identifier: "FeeOracle" },
);

/**
 * Input type for creating FeeOracle data.
 *
 * @description
 * Accepts flexible numeric types for fee values. All values are
 * normalized to bigint during construction.
 *
 * @see {@link FeeOracleType} for validated output type
 * @since 0.0.1
 */
export type FeeOracleInput = {
	readonly baseFee: bigint | number | string;
	readonly priorityFee: bigint | number | string;
	readonly maxFee: bigint | number | string;
	readonly gasPrice?: bigint | number | string;
	readonly estimatedTime?: number;
};

/**
 * Effect Schema for validating fee oracle data.
 *
 * @description
 * Validates and transforms fee estimation input to normalized bigint values.
 *
 * @param input - FeeOracleInput with flexible numeric types
 * @returns FeeOracleType with normalized bigint values
 *
 * @throws {ParseError} When required fields are missing or invalid
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { FeeOracleSchema } from 'voltaire-effect/primitives/FeeOracle'
 *
 * const fees = S.decodeSync(FeeOracleSchema)({
 *   baseFee: '20000000000',
 *   priorityFee: 2,
 *   maxFee: 50000000000n,
 *   estimatedTime: 12
 * })
 * ```
 *
 * @since 0.0.1
 */
export const FeeOracleSchema: S.Schema<FeeOracleType, FeeOracleInput> =
	S.transformOrFail(
		S.Struct({
			baseFee: S.Union(S.BigIntFromSelf, S.Number, S.String),
			priorityFee: S.Union(S.BigIntFromSelf, S.Number, S.String),
			maxFee: S.Union(S.BigIntFromSelf, S.Number, S.String),
			gasPrice: S.optional(S.Union(S.BigIntFromSelf, S.Number, S.String)),
			estimatedTime: S.optional(S.Number),
		}),
		FeeOracleTypeSchema,
		{
			strict: true,
			decode: (input, _options, ast) => {
				try {
					const result: FeeOracleType = {
						baseFee: BigInt(input.baseFee),
						priorityFee: BigInt(input.priorityFee),
						maxFee: BigInt(input.maxFee),
					};
					if (input.gasPrice !== undefined) {
						(result as any).gasPrice = BigInt(input.gasPrice);
					}
					if (input.estimatedTime !== undefined) {
						(result as any).estimatedTime = input.estimatedTime;
					}
					return ParseResult.succeed(result);
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, input, (e as Error).message),
					);
				}
			},
			encode: (state) =>
				ParseResult.succeed({
					baseFee: state.baseFee,
					priorityFee: state.priorityFee,
					maxFee: state.maxFee,
					gasPrice: state.gasPrice,
					estimatedTime: state.estimatedTime,
				}),
		},
	).annotations({ identifier: "FeeOracleSchema" });
