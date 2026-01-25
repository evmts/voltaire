/**
 * @fileoverview Effect Schema for Ethereum RPC signature format.
 * Provides bidirectional transformation between RPC objects and SignatureType.
 *
 * @module Rpc
 * @since 0.1.0
 */

import { Signature, type SignatureType } from "@tevm/voltaire/Signature";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Internal schema declaration for SignatureType.
 * Validates that a value is a Uint8Array with algorithm property.
 *
 * @internal
 */
const SignatureTypeSchema = S.declare<SignatureType>(
	(u): u is SignatureType => {
		if (!(u instanceof Uint8Array)) return false;
		const val = u as unknown as Record<string, unknown>;
		return (
			"algorithm" in val &&
			(val.algorithm === "secp256k1" ||
				val.algorithm === "p256" ||
				val.algorithm === "ed25519")
		);
	},
	{ identifier: "Signature" },
);

/**
 * RPC signature format schema.
 */
const RpcSignatureSchema = S.Struct({
	r: S.String,
	s: S.String,
	yParity: S.optional(S.Union(S.String, S.Number)),
	v: S.optional(S.Union(S.String, S.Number)),
});

type RpcSignature = S.Schema.Type<typeof RpcSignatureSchema>;

/**
 * Schema for Signature in Ethereum RPC format.
 *
 * @description
 * Transforms Ethereum RPC signature objects to SignatureType and vice versa.
 * The RPC format uses hex-encoded r and s components with optional yParity/v.
 *
 * @example Decoding
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as S from 'effect/Schema'
 *
 * const sig = S.decodeSync(Signature.Rpc)({
 *   r: '0x' + 'ab'.repeat(32),
 *   s: '0x' + 'cd'.repeat(32),
 *   yParity: '0x0'
 * })
 * ```
 *
 * @example Encoding
 * ```typescript
 * const rpc = S.encodeSync(Signature.Rpc)(sig)
 * // { r: '0x...', s: '0x...', yParity: '0x0', v: '0x1b' }
 * ```
 *
 * @since 0.1.0
 */
export const Rpc: S.Schema<
	SignatureType,
	{ r: string; s: string; yParity?: string | number; v?: string | number }
> = S.transformOrFail(RpcSignatureSchema, SignatureTypeSchema, {
	strict: true,
	decode: (rpc, _options, ast) => {
		try {
			return ParseResult.succeed(Signature.fromRpc(rpc));
		} catch (e) {
			return ParseResult.fail(
				new ParseResult.Type(ast, rpc, (e as Error).message),
			);
		}
	},
	encode: (sig, _options, ast) => {
		try {
			const rpc = Signature.toRpc(sig);
			return ParseResult.succeed(rpc as RpcSignature);
		} catch (e) {
			return ParseResult.fail(
				new ParseResult.Type(ast, sig, (e as Error).message),
			);
		}
	},
}).annotations({ identifier: "Signature.Rpc" });
