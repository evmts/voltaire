/**
 * @fileoverview Effect Schema for Solidity function signatures.
 * @module FunctionSignature/String
 * @since 0.1.0
 *
 * @description
 * Function signatures are the canonical representation of Solidity function definitions.
 * This module provides parsing and validation for signatures like "transfer(address,uint256)".
 */

import { FunctionSignature } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Represents a parsed Solidity function signature.
 * @since 0.1.0
 */
export type FunctionSignatureType = ReturnType<typeof FunctionSignature.from>;

const FunctionSignatureTypeSchema = S.declare<FunctionSignatureType>(
	(u): u is FunctionSignatureType => {
		if (typeof u !== "object" || u === null) return false;
		const obj = u as Record<string, unknown>;
		return (
			obj.selector instanceof Uint8Array &&
			typeof obj.signature === "string" &&
			typeof obj.name === "string"
		);
	},
	{ identifier: "FunctionSignature" },
);

/**
 * Schema for FunctionSignature from string.
 *
 * @description
 * Parses a Solidity function signature string and extracts:
 * - The function name
 * - The 4-byte selector (keccak256 hash truncated)
 * - The canonical signature string
 *
 * @example Decoding
 * ```typescript
 * import * as FunctionSignature from 'voltaire-effect/primitives/FunctionSignature'
 * import * as S from 'effect/Schema'
 *
 * const sig = S.decodeSync(FunctionSignature.String)('transfer(address,uint256)')
 * console.log(sig.name)       // 'transfer'
 * console.log(sig.selector)   // Uint8Array [0xa9, 0x05, 0x9c, 0xbb]
 * console.log(sig.signature)  // 'transfer(address,uint256)'
 * ```
 *
 * @example Encoding
 * ```typescript
 * const sigString = S.encodeSync(FunctionSignature.String)(sig)
 * // 'transfer(address,uint256)'
 * ```
 *
 * @since 0.1.0
 */
export const String: S.Schema<FunctionSignatureType, string> =
	S.transformOrFail(S.String, FunctionSignatureTypeSchema, {
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(FunctionSignature.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (f) => ParseResult.succeed(f.signature),
	}).annotations({ identifier: "FunctionSignature.String" });

export { String as Schema };
