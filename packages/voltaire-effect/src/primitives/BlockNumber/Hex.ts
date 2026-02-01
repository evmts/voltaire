/**
 * @fileoverview Schema for BlockNumber encoded as a hex string.
 * @module BlockNumber/Hex
 * @since 0.1.0
 */

import { BlockNumber, Hex as HexPrimitive } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { BlockNumberTypeSchema } from "./BlockNumberTypeSchema.js";

type BlockNumberType = BlockNumber.BlockNumberType;

/**
 * Schema for BlockNumber encoded as a hex string.
 *
 * @description
 * Transforms hex strings (with 0x prefix) to BlockNumber and vice versa.
 *
 * @example Decoding
 * ```typescript
 * import * as BlockNumber from 'voltaire-effect/primitives/BlockNumber'
 * import * as S from 'effect/Schema'
 *
 * const blockNum = S.decodeSync(BlockNumber.Hex)('0x3039')
 * // 12345n
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(BlockNumber.Hex)(blockNum)
 * // "0x3039"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<BlockNumberType, string> = S.transformOrFail(
	S.String,
	BlockNumberTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				const bigint = HexPrimitive.toBigInt(HexPrimitive(s));
				return ParseResult.succeed(BlockNumber.from(bigint));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (bn, _options, _ast) => {
			return ParseResult.succeed(HexPrimitive.fromBigInt(bn));
		},
	},
).annotations({ identifier: "BlockNumber.Hex" });
