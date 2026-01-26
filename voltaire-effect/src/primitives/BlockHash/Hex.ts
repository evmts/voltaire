/**
 * @fileoverview Schema for BlockHash encoded as a hex string.
 * @module BlockHash/Hex
 * @since 0.1.0
 */

import { BlockHash } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { BlockHashTypeSchema } from "./BlockHashTypeSchema.js";

type BlockHashType = BlockHash.BlockHashType;

/**
 * Schema for BlockHash encoded as a hex string.
 *
 * @description
 * Transforms 66-character hex strings (0x + 64 hex chars) to 32-byte BlockHash.
 *
 * @example Decoding
 * ```typescript
 * import * as BlockHash from 'voltaire-effect/primitives/BlockHash'
 * import * as S from 'effect/Schema'
 *
 * const hash = S.decodeSync(BlockHash.Hex)(
 *   '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3'
 * )
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(BlockHash.Hex)(hash)
 * // "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<BlockHashType, string> = S.transformOrFail(
	S.String,
	BlockHashTypeSchema,
	{
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
		encode: (hash, _options, _ast) => {
			return ParseResult.succeed(BlockHash.toHex(hash));
		},
	},
).annotations({ identifier: "BlockHash.Hex" });
