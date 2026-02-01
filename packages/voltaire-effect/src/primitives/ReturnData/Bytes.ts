/**
 * @fileoverview Schema for ReturnData encoded as Uint8Array.
 * @module ReturnData/Bytes
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
 * Schema for ReturnData encoded as Uint8Array.
 *
 * @description
 * Transforms Uint8Array to ReturnDataType and vice versa.
 *
 * @example Decoding
 * ```typescript
 * import * as ReturnData from 'voltaire-effect/primitives/ReturnData'
 * import * as S from 'effect/Schema'
 *
 * const data = S.decodeSync(ReturnData.Bytes)(new Uint8Array([0xab, 0xcd]))
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(ReturnData.Bytes)(data)
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<ReturnDataType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	ReturnDataTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(ReturnData.from(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (data, _options, _ast) => {
			return ParseResult.succeed(data as Uint8Array);
		},
	},
).annotations({ identifier: "ReturnData.Bytes" });
