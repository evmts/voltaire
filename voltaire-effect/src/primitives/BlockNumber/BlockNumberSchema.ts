/**
 * @fileoverview Effect Schema for block number validation.
 * Provides type-safe parsing and validation of block numbers.
 *
 * @module BlockNumber/BlockNumberSchema
 * @since 0.0.1
 */

import { BlockNumber } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";

/**
 * Type alias for the branded BlockNumber type.
 * @internal
 */
type BlockNumberType = BlockNumber.BlockNumberType;

/**
 * Internal schema for validating branded BlockNumber type.
 * @internal
 */
const BlockNumberTypeSchema = Schema.declare<BlockNumberType>(
	(u): u is BlockNumberType => typeof u === "bigint" && u >= 0n,
	{ identifier: "BlockNumber" },
);

/**
 * Effect Schema for validating and parsing block numbers.
 *
 * @description
 * Transforms number or bigint values into branded `BlockNumberType` values.
 * Performs validation to ensure:
 * - Input is a number or bigint
 * - Value is non-negative (>= 0)
 *
 * The schema supports bidirectional transformation:
 * - Decode: number | bigint → BlockNumberType
 * - Encode: BlockNumberType → bigint
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { BlockNumberSchema } from 'voltaire-effect/primitives/BlockNumber'
 * import * as Schema from 'effect/Schema'
 *
 * // Decode from number
 * const blockNum = Schema.decodeSync(BlockNumberSchema)(12345)
 *
 * // Decode from bigint
 * const blockNumBig = Schema.decodeSync(BlockNumberSchema)(12345n)
 *
 * // Encode back to bigint
 * const encoded = Schema.encodeSync(BlockNumberSchema)(blockNum)
 * ```
 *
 * @example
 * ```typescript
 * // Validate unknown input
 * import * as Effect from 'effect/Effect'
 *
 * const result = await Effect.runPromise(
 *   Schema.decodeUnknown(BlockNumberSchema)(userInput).pipe(
 *     Effect.catchAll((e) => Effect.fail(new Error('Invalid block number')))
 *   )
 * )
 * ```
 *
 * @example
 * ```typescript
 * // Type guard
 * const isBlockNumber = Schema.is(BlockNumberSchema)
 * if (isBlockNumber(data)) {
 *   console.log('Valid block number:', data)
 * }
 * ```
 *
 * @throws {ParseError} When input is negative or not a valid number/bigint.
 *
 * @see {@link from} for Effect-based construction
 */
export const BlockNumberSchema: Schema.Schema<
	BlockNumberType,
	number | bigint
> = Schema.transformOrFail(
	Schema.Union(Schema.Number, Schema.BigIntFromSelf),
	BlockNumberTypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(BlockNumber.from(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (bn) => ParseResult.succeed(BlockNumber.toBigInt(bn)),
	},
).annotations({ identifier: "BlockNumberSchema" });
