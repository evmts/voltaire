/**
 * @fileoverview Schema for BlockNumber encoded as a bigint.
 * @module BlockNumber/BigInt
 * @since 0.1.0
 */

import { BlockNumber } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { BlockNumberTypeSchema } from "./BlockNumberTypeSchema.js";

type BlockNumberType = BlockNumber.BlockNumberType;

/**
 * Schema for BlockNumber encoded as a bigint (non-negative).
 *
 * @example Decoding
 * ```typescript
 * import * as BlockNumber from 'voltaire-effect/primitives/BlockNumber'
 * import * as S from 'effect/Schema'
 *
 * const blockNum = S.decodeSync(BlockNumber.BigInt)(12345n)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bigint = S.encodeSync(BlockNumber.BigInt)(blockNum)
 * // 12345n
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<BlockNumberType, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
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
		encode: (bn, _options, _ast) => {
			return ParseResult.succeed(BlockNumber.toBigInt(bn));
		},
	},
).annotations({ identifier: "BlockNumber.BigInt" });
