/**
 * @fileoverview Schema for InitCode encoded as Uint8Array.
 * @module InitCode/Bytes
 * @since 0.1.0
 */

import {
	type InitCodeType,
	from as voltaireFrom,
} from "@tevm/voltaire/InitCode";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Internal schema declaration for InitCodeType validation.
 * @internal
 */
const InitCodeTypeSchema = S.declare<InitCodeType>(
	(u): u is InitCodeType => u instanceof Uint8Array,
	{ identifier: "InitCode" },
);

/**
 * Schema for InitCode encoded as Uint8Array.
 *
 * @description
 * Transforms Uint8Array to InitCodeType and vice versa.
 *
 * @example Decoding
 * ```typescript
 * import * as InitCode from 'voltaire-effect/primitives/InitCode'
 * import * as S from 'effect/Schema'
 *
 * const code = S.decodeSync(InitCode.Bytes)(new Uint8Array([0x60, 0x80, 0x60, 0x40]))
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(InitCode.Bytes)(code)
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<InitCodeType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	InitCodeTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(voltaireFrom(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (code, _options, _ast) => {
			return ParseResult.succeed(code as Uint8Array);
		},
	},
).annotations({ identifier: "InitCode.Bytes" });
