/**
 * Schema for PrivateKey encoded as raw bytes.
 *
 * @description
 * Transforms Uint8Array to PrivateKeyType and vice versa.
 * Accepts 32-byte arrays. Encodes back to Uint8Array.
 *
 * @example Decoding
 * ```typescript
 * import * as PrivateKey from 'voltaire-effect/primitives/PrivateKey'
 * import * as S from 'effect/Schema'
 *
 * const bytes = new Uint8Array(32).fill(1)
 * const pk = S.decodeSync(PrivateKey.Bytes)(bytes)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const rawBytes = S.encodeSync(PrivateKey.Bytes)(pk)
 * ```
 *
 * @module PrivateKey/Bytes
 * @since 0.1.0
 */

import { PrivateKey, type PrivateKeyType } from "@tevm/voltaire/PrivateKey";
import { Redacted } from "effect";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const PrivateKeyTypeSchema = S.declare<PrivateKeyType>(
	(u): u is PrivateKeyType => u instanceof Uint8Array && u.length === 32,
	{ identifier: "PrivateKey" },
);

export const Bytes: S.Schema<PrivateKeyType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	PrivateKeyTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(PrivateKey.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (pk, _options, ast) => {
			try {
				return ParseResult.succeed(new Uint8Array(pk));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, pk, (e as Error).message),
				);
			}
		},
	},
).annotations({ identifier: "PrivateKey.Bytes" });

/**
 * Schema for PrivateKey encoded as raw bytes, wrapped in Redacted.
 *
 * @description
 * Transforms Uint8Array to Redacted<PrivateKeyType> for secure handling.
 * The redacted wrapper prevents accidental logging of private keys.
 * Use `Redacted.value()` to explicitly unwrap for cryptographic operations.
 *
 * @example Decoding
 * ```typescript
 * import * as PrivateKey from 'voltaire-effect/primitives/PrivateKey'
 * import { Redacted } from 'effect'
 * import * as S from 'effect/Schema'
 *
 * const bytes = new Uint8Array(32).fill(1)
 * const pk = S.decodeSync(PrivateKey.RedactedBytes)(bytes)
 * console.log(pk) // Redacted(<redacted>)
 *
 * const unwrapped = Redacted.value(pk)
 * // Use unwrapped for signing
 * ```
 *
 * @since 0.1.0
 */
export const RedactedBytes: S.Schema<
	Redacted.Redacted<PrivateKeyType>,
	Uint8Array
> = S.transformOrFail(S.Uint8ArrayFromSelf, S.Redacted(PrivateKeyTypeSchema), {
	strict: true,
	decode: (bytes, _options, ast) => {
		try {
			return ParseResult.succeed(Redacted.make(PrivateKey.fromBytes(bytes)));
		} catch (e) {
			return ParseResult.fail(
				new ParseResult.Type(ast, bytes, "Invalid private key format"),
			);
		}
	},
	encode: (redacted, _options, ast) => {
		try {
			return ParseResult.succeed(new Uint8Array(Redacted.value(redacted)));
		} catch (e) {
			return ParseResult.fail(
				new ParseResult.Type(ast, redacted, (e as Error).message),
			);
		}
	},
}).annotations({
	identifier: "PrivateKey.RedactedBytes",
	title: "Private Key (Redacted)",
	description:
		"A 32-byte secp256k1 private key wrapped in Redacted to prevent accidental logging",
});
