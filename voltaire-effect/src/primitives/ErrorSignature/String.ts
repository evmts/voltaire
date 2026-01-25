/**
 * @fileoverview Effect Schema for Solidity error selectors.
 * @module ErrorSignature/String
 * @since 0.1.0
 *
 * @description
 * Error signatures are 4-byte selectors that identify Solidity custom errors.
 * They are computed the same way as function selectors.
 */

import { ErrorSignature } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing a 4-byte Solidity error selector.
 * @since 0.1.0
 */
export type ErrorSignatureType = ReturnType<typeof ErrorSignature.from>;

/**
 * Input types accepted for creating an ErrorSignature.
 * @since 0.1.0
 */
export type ErrorSignatureLike = Parameters<typeof ErrorSignature.from>[0];

const ErrorSignatureTypeSchema = S.declare<ErrorSignatureType>(
	(u): u is ErrorSignatureType => u instanceof Uint8Array && u.length === 4,
	{ identifier: "ErrorSignature" },
);

/**
 * Schema for ErrorSignature from string.
 *
 * @description
 * Transforms error signature strings to ErrorSignatureType.
 * Accepts error definition strings or hex-encoded 4-byte selectors.
 * Encodes to hex string.
 *
 * @example Decoding
 * ```typescript
 * import * as ErrorSignature from 'voltaire-effect/primitives/ErrorSignature'
 * import * as S from 'effect/Schema'
 *
 * // From error definition
 * const sig = S.decodeSync(ErrorSignature.String)('InsufficientBalance(uint256,uint256)')
 *
 * // From hex
 * const fromHex = S.decodeSync(ErrorSignature.String)('0x08c379a0')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(ErrorSignature.String)(sig)
 * ```
 *
 * @since 0.1.0
 */
export const String: S.Schema<ErrorSignatureType, string> = S.transformOrFail(
	S.String,
	ErrorSignatureTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			try {
				if (value.includes("(")) {
					return ParseResult.succeed(ErrorSignature.fromSignature(value));
				}
				return ParseResult.succeed(ErrorSignature.from(value));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (sig) => ParseResult.succeed(ErrorSignature.toHex(sig)),
	},
).annotations({ identifier: "ErrorSignature.String" });

export { String as ErrorSignatureSchema };

/**
 * Converts an ErrorSignature to hex string.
 *
 * @param sig - The error signature
 * @returns hex string
 * @since 0.1.0
 */
export const toHex = (sig: ErrorSignatureType): string =>
	ErrorSignature.toHex(sig);

/**
 * Compares two error signatures for equality.
 *
 * @param a - First signature
 * @param b - Second signature
 * @returns true if equal
 * @since 0.1.0
 */
export const equals = (a: ErrorSignatureType, b: ErrorSignatureType): boolean =>
	ErrorSignature.equals(a, b);
