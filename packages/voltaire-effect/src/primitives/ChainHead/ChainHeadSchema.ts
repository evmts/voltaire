/**
 * @fileoverview Effect Schema definitions for blockchain head information.
 * Provides type-safe schemas for parsing and validating chain head data.
 * @module ChainHead/ChainHeadSchema
 * @since 0.0.1
 */

import { ChainHead } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing the head of a blockchain.
 *
 * @description
 * Contains information about the latest block in a blockchain, including:
 * - Block number (height)
 * - Block hash
 * - Timestamp
 * - Difficulty (for PoW chains)
 * - Total difficulty (cumulative)
 *
 * @since 0.0.1
 */
export type ChainHeadType = ChainHead.ChainHeadType;

/**
 * Internal schema declaration for validating ChainHeadType instances.
 * Ensures the object has required number, hash, and timestamp properties.
 *
 * @internal
 */
const ChainHeadTypeSchema = S.declare<ChainHeadType>(
	(u): u is ChainHeadType =>
		u !== null &&
		typeof u === "object" &&
		"number" in u &&
		"hash" in u &&
		"timestamp" in u,
	{ identifier: "ChainHead" },
);

/**
 * Input type for creating a ChainHead.
 *
 * @description
 * The input required to create a ChainHeadType. Accepts flexible input
 * types (bigint, number, string) for numeric fields.
 *
 * @since 0.0.1
 */
export type ChainHeadInput = {
	/** Block number/height */
	readonly number: bigint | number | string;
	/** Block hash as bytes or hex string */
	readonly hash: Uint8Array | string;
	/** Unix timestamp */
	readonly timestamp: bigint | number | string;
	/** Block difficulty (optional, for PoW) */
	readonly difficulty?: bigint | number | string;
	/** Total cumulative difficulty (optional) */
	readonly totalDifficulty?: bigint | number | string;
};

/**
 * Effect Schema for validating blockchain head data.
 *
 * @description
 * Transforms input data into branded ChainHeadType values. Validates
 * that all required fields are present and properly formatted.
 *
 * @example
 * ```typescript
 * import * as ChainHead from 'voltaire-effect/primitives/ChainHead'
 * import * as Schema from 'effect/Schema'
 *
 * // Create chain head from block data
 * const head = Schema.decodeSync(ChainHead.ChainHeadSchema)({
 *   number: 19000000n,
 *   hash: '0xabc123...',
 *   timestamp: 1700000000n
 * })
 *
 * // With difficulty (for PoW chains)
 * const powHead = Schema.decodeSync(ChainHead.ChainHeadSchema)({
 *   number: 15000000n,
 *   hash: '0x...',
 *   timestamp: 1660000000n,
 *   difficulty: 12000000000000000n,
 *   totalDifficulty: 58750000000000000000000n
 * })
 * ```
 *
 * @throws ParseResult.Type - When required fields are missing or invalid
 * @see {@link from} for Effect-wrapped chain head creation
 * @since 0.0.1
 */
export const ChainHeadSchema: S.Schema<ChainHeadType, ChainHeadInput> =
	S.transformOrFail(
		S.Struct({
			number: S.Union(S.BigIntFromSelf, S.Number, S.String),
			hash: S.Union(S.Uint8ArrayFromSelf, S.String),
			timestamp: S.Union(S.BigIntFromSelf, S.Number, S.String),
			difficulty: S.optional(S.Union(S.BigIntFromSelf, S.Number, S.String)),
			totalDifficulty: S.optional(
				S.Union(S.BigIntFromSelf, S.Number, S.String),
			),
		}),
		ChainHeadTypeSchema,
		{
			strict: true,
			decode: (input, _options, ast) => {
				try {
					return ParseResult.succeed(ChainHead.from(input as any));
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, input, (e as Error).message),
					);
				}
			},
			encode: (chainHead) =>
				ParseResult.succeed({
					number: chainHead.number,
					hash: chainHead.hash as any,
					timestamp: chainHead.timestamp,
					difficulty: chainHead.difficulty,
					totalDifficulty: chainHead.totalDifficulty,
				}),
		},
	).annotations({ identifier: "ChainHeadSchema" });
