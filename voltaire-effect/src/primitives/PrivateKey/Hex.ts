/**
 * Schema for PrivateKey encoded as a hex string.
 *
 * @description
 * Transforms hex strings to PrivateKeyType and vice versa.
 * Accepts 64-character hex strings (with or without 0x prefix).
 * Encodes to lowercase hex with 0x prefix.
 *
 * @example Decoding
 * ```typescript
 * import * as PrivateKey from 'voltaire-effect/primitives/PrivateKey'
 * import * as S from 'effect/Schema'
 *
 * const pk = S.decodeSync(PrivateKey.Hex)('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(PrivateKey.Hex)(pk)
 * // "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
 * ```
 *
 * @module PrivateKey/Hex
 * @since 0.1.0
 */

import {
	_toHex,
	PrivateKey,
	type PrivateKeyType,
} from "@tevm/voltaire/PrivateKey";
import { Redacted } from "effect";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

// Pre-computed example private key for schema annotations (test vector only)
const EXAMPLE_PRIVATE_KEY: PrivateKeyType = PrivateKey.from(
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
);

const PrivateKeyTypeSchema = S.declare<PrivateKeyType>(
	(u): u is PrivateKeyType => u instanceof Uint8Array && u.length === 32,
	{ identifier: "PrivateKey" },
);

export const Hex: S.Schema<PrivateKeyType, string> = S.transformOrFail(
	S.String,
	PrivateKeyTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(PrivateKey.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (pk, _options, ast) => {
			try {
				return ParseResult.succeed(_toHex.call(pk));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, pk, (e as Error).message),
				);
			}
		},
	},
).annotations({
	identifier: "PrivateKey.Hex",
	title: "Private Key",
	description:
		"A 32-byte secp256k1 private key as a hex string. NEVER log or expose this value.",
	examples: [EXAMPLE_PRIVATE_KEY],
	message: () => "Invalid private key: expected 64 hex characters (32 bytes)",
});

/**
 * Schema for PrivateKey encoded as hex string, wrapped in Redacted.
 *
 * @description
 * Transforms hex strings to Redacted<PrivateKeyType> for secure handling.
 * The redacted wrapper prevents accidental logging of private keys.
 * Use `Redacted.value()` to explicitly unwrap for cryptographic operations.
 *
 * @example Decoding
 * ```typescript
 * import * as PrivateKey from 'voltaire-effect/primitives/PrivateKey'
 * import { Redacted } from 'effect'
 * import * as S from 'effect/Schema'
 *
 * const pk = S.decodeSync(PrivateKey.RedactedHex)('0x0123...')
 * console.log(pk) // Redacted(<redacted>)
 *
 * const unwrapped = Redacted.value(pk)
 * // Use unwrapped for signing
 * ```
 *
 * @since 0.1.0
 */
export const RedactedHex: S.Schema<
	Redacted.Redacted<PrivateKeyType>,
	string
> = Hex.pipe(S.Redacted).annotations({
	identifier: "PrivateKey.RedactedHex",
	title: "Private Key (Redacted)",
	description:
		"A 32-byte secp256k1 private key wrapped in Redacted to prevent accidental logging. NEVER log or expose the unwrapped value.",
	examples: [Redacted.make(EXAMPLE_PRIVATE_KEY)],
	message: () => "Invalid private key: expected 64 hex characters (32 bytes)",
});
