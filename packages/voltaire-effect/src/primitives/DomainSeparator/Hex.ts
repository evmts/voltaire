import { DomainSeparator } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing an EIP-712 domain separator (32-byte hash).
 * @since 0.1.0
 */
export type DomainSeparatorType = ReturnType<typeof DomainSeparator.from>;

const DomainSeparatorTypeSchema = S.declare<DomainSeparatorType>(
	(u): u is DomainSeparatorType => u instanceof Uint8Array && u.length === 32,
	{ identifier: "DomainSeparator" },
);

/**
 * Schema for DomainSeparator encoded as a hex string.
 *
 * @description
 * Transforms hex strings to DomainSeparatorType and vice versa.
 * Accepts hex strings with 0x prefix.
 * Encodes to lowercase hex.
 *
 * @example Decoding
 * ```typescript
 * import * as DomainSeparator from 'voltaire-effect/primitives/DomainSeparator'
 * import * as S from 'effect/Schema'
 *
 * const separator = S.decodeSync(DomainSeparator.Hex)('0x...')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(DomainSeparator.Hex)(separator)
 * // "0xabcd..."
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<DomainSeparatorType, string> = S.transformOrFail(
	S.String,
	DomainSeparatorTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(DomainSeparator.fromHex(value));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (separator) =>
			ParseResult.succeed(DomainSeparator.toHex(separator)),
	},
).annotations({ identifier: "DomainSeparator.Hex" });

export { Hex as DomainSeparatorSchema };

/**
 * Schema for DomainSeparator from Uint8Array bytes.
 *
 * @description
 * Transforms 32-byte Uint8Array to DomainSeparatorType.
 *
 * @example Decoding
 * ```typescript
 * import * as DomainSeparator from 'voltaire-effect/primitives/DomainSeparator'
 * import * as S from 'effect/Schema'
 *
 * const separator = S.decodeSync(DomainSeparator.Bytes)(bytes)
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<DomainSeparatorType, Uint8Array> =
	S.transformOrFail(S.Uint8ArrayFromSelf, DomainSeparatorTypeSchema, {
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(DomainSeparator.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (separator) => ParseResult.succeed(separator),
	}).annotations({ identifier: "DomainSeparator.Bytes" });

export { Bytes as DomainSeparatorFromBytesSchema };

/**
 * Compares two domain separators for equality.
 *
 * @param a - First domain separator
 * @param b - Second domain separator
 * @returns true if equal
 * @since 0.1.0
 */
export const equals = (
	a: DomainSeparatorType,
	b: DomainSeparatorType,
): boolean => DomainSeparator.equals(a, b);
