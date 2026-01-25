/**
 * @fileoverview Schema for RuntimeCode encoded as hex string.
 * @module RuntimeCode/Hex
 * @since 0.1.0
 */

import { RuntimeCode } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { RuntimeCodeType } from "./RuntimeCodeSchema.js";

/**
 * Internal schema declaration for RuntimeCodeType validation.
 * @internal
 */
const RuntimeCodeTypeSchema = S.declare<RuntimeCodeType>(
	(u): u is RuntimeCodeType => u instanceof Uint8Array,
	{ identifier: "RuntimeCode" },
);

/**
 * Schema for RuntimeCode encoded as a hex string.
 *
 * @description
 * Transforms hex strings to RuntimeCodeType and vice versa.
 * Runtime code is the bytecode stored at a contract address after deployment.
 *
 * @example Decoding
 * ```typescript
 * import * as RuntimeCode from 'voltaire-effect/primitives/RuntimeCode'
 * import * as S from 'effect/Schema'
 *
 * const code = S.decodeSync(RuntimeCode.Hex)('0x6080604052...')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(RuntimeCode.Hex)(code)
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<RuntimeCodeType, string> = S.transformOrFail(
	S.String,
	RuntimeCodeTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(RuntimeCode.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (code, _options, _ast) => {
			return ParseResult.succeed(RuntimeCode.toHex(code));
		},
	},
).annotations({ identifier: "RuntimeCode.Hex" });
