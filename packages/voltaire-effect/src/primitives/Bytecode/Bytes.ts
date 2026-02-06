/**
 * @fileoverview Schema for Bytecode encoded as Uint8Array.
 * @module Bytecode/Bytes
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
 * Schema for Bytecode encoded as Uint8Array.
 *
 * @description
 * Transforms Uint8Array to BytecodeType and vice versa.
 *
 * @example Decoding
 * ```typescript
 * import * as Bytecode from 'voltaire-effect/primitives/Bytecode'
 * import * as S from 'effect/Schema'
 *
 * const code = S.decodeSync(Bytecode.Bytes)(new Uint8Array([0x60, 0x80, 0x60, 0x40]))
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(Bytecode.Bytes)(code)
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<BytecodeType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	BytecodeTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(Bytecode.from(bytes));
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
).annotations({ identifier: "Bytecode.Bytes" });
