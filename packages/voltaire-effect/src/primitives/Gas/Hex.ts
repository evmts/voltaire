/**
 * @fileoverview Effect Schema for Gas from hex string encoding.
 * Provides bidirectional transformation between hex strings and GasType.
 *
 * @module Hex
 * @since 0.1.0
 */

import { Uint } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { GasType } from "./Number.js";

/**
 * Internal schema declaration for GasType.
 * Validates that a value is a non-negative bigint.
 *
 * @internal
 */
const GasTypeSchema = S.declare<GasType>(
	(u): u is GasType => typeof u === "bigint" && u >= 0n,
	{ identifier: "Gas" },
);

/**
 * Schema for Gas encoded as a hex string.
 *
 * @description
 * Transforms hex strings to GasType and vice versa.
 * Validates that the input is a valid hex string representing a non-negative integer.
 *
 * @example Decoding
 * ```typescript
 * import * as Gas from 'voltaire-effect/primitives/Gas'
 * import * as S from 'effect/Schema'
 *
 * const gas = S.decodeSync(Gas.Hex)('0x5208')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Gas.Hex)(gas)
 * // "0x5208"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<GasType, string> = S.transformOrFail(
	S.String,
	GasTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(Uint.from(s) as unknown as GasType);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (gas, _options, _ast) => {
			return ParseResult.succeed(`0x${gas.toString(16)}`);
		},
	},
).annotations({ identifier: "Gas.Hex" });
