/**
 * @fileoverview Effect Schema for block hash validation.
 * Provides type-safe parsing and validation of 32-byte block hashes.
 *
 * @module BlockHash/BlockHashSchema
 * @since 0.0.1
 */

import { BlockHash } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";

/**
 * Type alias for the branded BlockHash type.
 * @internal
 */
type BlockHashType = BlockHash.BlockHashType;

/**
 * Internal schema for validating branded BlockHash type.
 * @internal
 */
const BlockHashTypeSchema = Schema.declare<BlockHashType>(
	(u): u is BlockHashType => {
		if (!(u instanceof Uint8Array)) return false;
		try {
			BlockHash.toHex(u as BlockHashType);
			return true;
		} catch {
			return false;
		}
	},
	{ identifier: "BlockHash" },
);

/**
 * Effect Schema for validating and parsing block hashes.
 *
 * @description
 * Transforms hex strings into 32-byte `BlockHashType` values and vice versa.
 * Performs validation to ensure:
 * - Input is a valid hex string with '0x' prefix
 * - Decoded value is exactly 32 bytes
 *
 * The schema supports bidirectional transformation:
 * - Decode: hex string → BlockHashType (Uint8Array)
 * - Encode: BlockHashType → hex string
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { BlockHashSchema } from 'voltaire-effect/primitives/BlockHash'
 * import * as Schema from 'effect/Schema'
 *
 * // Decode from hex string
 * const hash = Schema.decodeSync(BlockHashSchema)(
 *   '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3'
 * )
 *
 * // Encode back to hex string
 * const hex = Schema.encodeSync(BlockHashSchema)(hash)
 * ```
 *
 * @example
 * ```typescript
 * // Validate unknown input
 * import * as Effect from 'effect/Effect'
 *
 * const result = await Effect.runPromise(
 *   Schema.decodeUnknown(BlockHashSchema)(userInput).pipe(
 *     Effect.catchAll((e) => Effect.fail(new Error('Invalid block hash')))
 *   )
 * )
 * ```
 *
 * @example
 * ```typescript
 * // Type guard
 * const isBlockHash = Schema.is(BlockHashSchema)
 * if (isBlockHash(data)) {
 *   console.log('Valid 32-byte hash')
 * }
 * ```
 *
 * @throws {ParseError} When input is not a valid 32-byte hex string.
 *
 * @see {@link from} for Effect-based construction
 * @see {@link toHex} for hex conversion utility
 */
export const BlockHashSchema: Schema.Schema<BlockHashType, string> =
	Schema.transformOrFail(Schema.String, BlockHashTypeSchema, {
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(BlockHash.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (h, _options, ast) => {
			try {
				return ParseResult.succeed(BlockHash.toHex(h));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, h, (e as Error).message),
				);
			}
		},
	}).annotations({ identifier: "BlockHashSchema" });
