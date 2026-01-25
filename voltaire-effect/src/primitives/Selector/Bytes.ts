/**
 * @fileoverview Schema for Selector encoded as Uint8Array.
 * @module Selector/Bytes
 * @since 0.1.0
 */

import { Selector } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { SelectorType } from "./SelectorSchema.js";

/**
 * Internal schema declaration for SelectorType validation.
 * @internal
 */
const SelectorTypeSchema = S.declare<SelectorType>(
	(u): u is SelectorType => u instanceof Uint8Array && u.length === 4,
	{ identifier: "Selector" },
);

/**
 * Schema for Selector encoded as Uint8Array.
 *
 * @description
 * Transforms Uint8Array to SelectorType and vice versa.
 * Input must be exactly 4 bytes.
 *
 * @example Decoding
 * ```typescript
 * import * as Selector from 'voltaire-effect/primitives/Selector'
 * import * as S from 'effect/Schema'
 *
 * const selector = S.decodeSync(Selector.Bytes)(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]))
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(Selector.Bytes)(selector)
 * // Uint8Array(4) [0xa9, 0x05, 0x9c, 0xbb]
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<SelectorType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	SelectorTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(
					Selector.from(bytes) as unknown as SelectorType,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (selector, _options, _ast) => {
			return ParseResult.succeed(selector as Uint8Array);
		},
	},
).annotations({ identifier: "Selector.Bytes" });
