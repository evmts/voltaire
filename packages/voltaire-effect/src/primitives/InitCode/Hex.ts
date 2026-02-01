/**
 * @fileoverview Schema for InitCode encoded as hex string.
 * @module InitCode/Hex
 * @since 0.1.0
 */

import {
	type InitCodeType,
	from as voltaireFrom,
	toHex as voltaireToHex,
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
 * Schema for InitCode encoded as a hex string.
 *
 * @description
 * Transforms hex strings to InitCodeType and vice versa.
 * Init code is the bytecode used during contract deployment.
 *
 * @example Decoding
 * ```typescript
 * import * as InitCode from 'voltaire-effect/primitives/InitCode'
 * import * as S from 'effect/Schema'
 *
 * const code = S.decodeSync(InitCode.Hex)('0x608060405234801561001057600080fd5b50')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(InitCode.Hex)(code)
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<InitCodeType, string> = S.transformOrFail(
	S.String,
	InitCodeTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(voltaireFrom(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (code, _options, _ast) => {
			return ParseResult.succeed(voltaireToHex(code));
		},
	},
).annotations({ identifier: "InitCode.Hex" });
