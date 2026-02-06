/**
 * @fileoverview Schema for RuntimeCode encoded as Uint8Array.
 * @module RuntimeCode/Bytes
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
 * Schema for RuntimeCode encoded as Uint8Array.
 *
 * @description
 * Transforms Uint8Array to RuntimeCodeType and vice versa.
 *
 * @example Decoding
 * ```typescript
 * import * as RuntimeCode from 'voltaire-effect/primitives/RuntimeCode'
 * import * as S from 'effect/Schema'
 *
 * const code = S.decodeSync(RuntimeCode.Bytes)(new Uint8Array([0x60, 0x80]))
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(RuntimeCode.Bytes)(code)
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<RuntimeCodeType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	RuntimeCodeTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(RuntimeCode.from(bytes));
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
).annotations({ identifier: "RuntimeCode.Bytes" });
