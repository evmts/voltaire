/**
 * @fileoverview Schema for BlockHash encoded as bytes.
 * @module BlockHash/Bytes
 * @since 0.1.0
 */

import { BlockHash } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { BlockHashTypeSchema } from "./BlockHashTypeSchema.js";

type BlockHashType = BlockHash.BlockHashType;

/**
 * Schema for BlockHash encoded as a Uint8Array.
 *
 * @description
 * Validates that the input is exactly 32 bytes.
 *
 * @example Decoding
 * ```typescript
 * import * as BlockHash from 'voltaire-effect/primitives/BlockHash'
 * import * as S from 'effect/Schema'
 *
 * const hash = S.decodeSync(BlockHash.Bytes)(bytes32)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(BlockHash.Bytes)(hash)
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<BlockHashType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	BlockHashTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(BlockHash.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (hash, _options, _ast) => {
			return ParseResult.succeed(hash as Uint8Array);
		},
	},
).annotations({ identifier: "BlockHash.Bytes" });
