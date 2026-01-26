/**
 * @fileoverview Schema for BlockNumber encoded as a JavaScript number.
 * @module BlockNumber/Number
 * @since 0.1.0
 */

import { BlockNumber } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { BlockNumberTypeSchema } from "./BlockNumberTypeSchema.js";

type BlockNumberType = BlockNumber.BlockNumberType;

/**
 * Schema for BlockNumber encoded as a JavaScript number.
 *
 * @description
 * Warning: Block numbers larger than Number.MAX_SAFE_INTEGER (2^53-1) may lose precision.
 * Use BigInt schema for large block numbers.
 *
 * @example Decoding
 * ```typescript
 * import * as BlockNumber from 'voltaire-effect/primitives/BlockNumber'
 * import * as S from 'effect/Schema'
 *
 * const blockNum = S.decodeSync(BlockNumber.Number)(12345)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const num = S.encodeSync(BlockNumber.Number)(blockNum)
 * // 12345
 * ```
 *
 * @since 0.1.0
 */
const isSafeInteger = globalThis.Number.isSafeInteger;

export const Number: S.Schema<BlockNumberType, number> = S.transformOrFail(
	S.Number,
	BlockNumberTypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			if (!isSafeInteger(n)) {
				return ParseResult.fail(
					new ParseResult.Type(
						ast,
						n,
						`Block number exceeds safe integer range: ${n}`,
					),
				);
			}
			try {
				return ParseResult.succeed(BlockNumber.from(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (bn, _options, _ast) => {
			return ParseResult.succeed(BlockNumber.toNumber(bn));
		},
	},
).annotations({ identifier: "BlockNumber.Number" });
