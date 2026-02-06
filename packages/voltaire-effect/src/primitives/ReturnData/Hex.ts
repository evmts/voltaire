/**
 * @fileoverview Schema for ReturnData encoded as hex string.
 * @module ReturnData/Hex
 * @since 0.1.0
 */

import { ReturnData } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { ReturnDataType } from "./ReturnDataSchema.js";

/**
 * Internal schema declaration for ReturnDataType validation.
 * @internal
 */
const ReturnDataTypeSchema = S.declare<ReturnDataType>(
	(u): u is ReturnDataType => u instanceof Uint8Array,
	{ identifier: "ReturnData" },
);

/**
 * Schema for ReturnData encoded as a hex string.
 *
 * @description
 * Transforms hex strings to ReturnDataType and vice versa.
 * Return data is the output from EVM contract calls and transactions.
 *
 * @example Decoding
 * ```typescript
 * import * as ReturnData from 'voltaire-effect/primitives/ReturnData'
 * import * as S from 'effect/Schema'
 *
 * const data = S.decodeSync(ReturnData.Hex)('0xabcd1234')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(ReturnData.Hex)(data)
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<ReturnDataType, string> = S.transformOrFail(
	S.String,
	ReturnDataTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(ReturnData.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (data, _options, _ast) => {
			return ParseResult.succeed(ReturnData.toHex(data));
		},
	},
).annotations({ identifier: "ReturnData.Hex" });
