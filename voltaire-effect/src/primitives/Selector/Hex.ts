/**
 * @fileoverview Schema for Selector encoded as hex string.
 * @module Selector/Hex
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
 * Schema for Selector encoded as a hex string.
 *
 * @description
 * Transforms hex strings to SelectorType and vice versa.
 * Accepts hex with or without 0x prefix.
 * Encodes to lowercase hex with 0x prefix.
 *
 * @example Decoding
 * ```typescript
 * import * as Selector from 'voltaire-effect/primitives/Selector'
 * import * as S from 'effect/Schema'
 *
 * const selector = S.decodeSync(Selector.Hex)('0xa9059cbb')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Selector.Hex)(selector)
 * // "0xa9059cbb"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<SelectorType, string> = S.transformOrFail(
	S.String,
	SelectorTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(
					Selector.fromHex(s) as unknown as SelectorType,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (selector, _options, _ast) => {
			return ParseResult.succeed(
				Selector.toHex(
					selector as unknown as Parameters<typeof Selector.toHex>[0],
				),
			);
		},
	},
).annotations({ identifier: "Selector.Hex" });
