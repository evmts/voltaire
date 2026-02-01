/**
 * @fileoverview Schema for Selector from function signature.
 * @module Selector/Signature
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
 * Schema for Selector from a function signature string.
 *
 * @description
 * Computes selector from function signature using keccak256.
 * Takes first 4 bytes of keccak256(signature).
 * Encoding returns the signature back (one-way in practice, as there's
 * no way to recover the original signature from just the selector).
 *
 * @example Decoding
 * ```typescript
 * import * as Selector from 'voltaire-effect/primitives/Selector'
 * import * as S from 'effect/Schema'
 *
 * const selector = S.decodeSync(Selector.Signature)('transfer(address,uint256)')
 * // selector bytes: 0xa9059cbb
 * ```
 *
 * @since 0.1.0
 */
export const Signature: S.Schema<SelectorType, string> = S.transformOrFail(
	S.String,
	SelectorTypeSchema,
	{
		strict: true,
		decode: (sig, _options, ast) => {
			try {
				return ParseResult.succeed(
					Selector.fromSignature(sig) as unknown as SelectorType,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, sig, (e as Error).message),
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
).annotations({ identifier: "Selector.Signature" });
