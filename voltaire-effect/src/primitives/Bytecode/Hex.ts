/**
 * @fileoverview Schema for Bytecode encoded as hex string.
 * @module Bytecode/Hex
 * @since 0.1.0
 */

import { Bytecode } from "@tevm/voltaire/Bytecode";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { BytecodeType } from "./BytecodeSchema.js";

/**
 * Internal schema declaration for BytecodeType validation.
 * @internal
 */
const BytecodeTypeSchema = S.declare<BytecodeType>(
	(u): u is BytecodeType => u instanceof Uint8Array,
	{ identifier: "Bytecode" },
);

/**
 * Schema for Bytecode encoded as a hex string.
 *
 * @description
 * Transforms hex strings to BytecodeType and vice versa.
 * Accepts hex with or without 0x prefix.
 *
 * @example Decoding
 * ```typescript
 * import * as Bytecode from 'voltaire-effect/primitives/Bytecode'
 * import * as S from 'effect/Schema'
 *
 * const code = S.decodeSync(Bytecode.Hex)('0x6080604052...')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Bytecode.Hex)(code)
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<BytecodeType, string> = S.transformOrFail(
	S.String,
	BytecodeTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(Bytecode.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (code, _options, _ast) => {
			return ParseResult.succeed(Bytecode.toHex(code));
		},
	},
).annotations({ identifier: "Bytecode.Hex" });
