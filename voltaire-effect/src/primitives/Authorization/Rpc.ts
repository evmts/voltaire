/**
 * Schema for EIP-7702 Authorization tuples in JSON-RPC format.
 *
 * @description
 * Transforms JSON-compatible authorization input into the branded
 * `AuthorizationType` with proper bigint and Uint8Array field types.
 *
 * @example Decoding
 * ```typescript
 * import * as Authorization from 'voltaire-effect/primitives/Authorization'
 * import * as S from 'effect/Schema'
 *
 * const auth = S.decodeSync(Authorization.Rpc)({
 *   chainId: '1',
 *   address: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
 *   nonce: '0',
 *   yParity: 0,
 *   r: '0x...',
 *   s: '0x...'
 * })
 * ```
 *
 * @example Encoding
 * ```typescript
 * const json = S.encodeSync(Authorization.Rpc)(auth)
 * ```
 *
 * @see https://eips.ethereum.org/EIPS/eip-7702
 * @module Authorization/Rpc
 * @since 0.1.0
 */

import {
	Authorization,
	type AuthorizationType,
} from "@tevm/voltaire/Authorization";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Raw authorization input type (JSON-compatible).
 * @since 0.1.0
 */
export type AuthorizationInput = {
	chainId: string | number | bigint;
	address: string;
	nonce: string | number | bigint;
	yParity: number;
	r: string;
	s: string;
};

const AuthorizationTypeSchema = S.declare<AuthorizationType>(
	(u): u is AuthorizationType => {
		if (typeof u !== "object" || u === null) return false;
		const auth = u as Record<string, unknown>;
		return (
			typeof auth.chainId === "bigint" &&
			auth.address instanceof Uint8Array &&
			typeof auth.nonce === "bigint" &&
			typeof auth.yParity === "number" &&
			auth.r instanceof Uint8Array &&
			auth.s instanceof Uint8Array
		);
	},
	{ identifier: "Authorization" },
);

const AuthorizationInputSchema = S.Struct({
	chainId: S.Union(S.String, S.Number, S.BigIntFromSelf),
	address: S.String,
	nonce: S.Union(S.String, S.Number, S.BigIntFromSelf),
	yParity: S.Number,
	r: S.String,
	s: S.String,
});

/**
 * Schema for EIP-7702 Authorization tuples in JSON-RPC format.
 *
 * @since 0.1.0
 */
export const Rpc: S.Schema<AuthorizationType, AuthorizationInput> =
	S.transformOrFail(AuthorizationInputSchema, AuthorizationTypeSchema, {
		strict: true,
		decode: (input, _options, ast) => {
			try {
				const auth: AuthorizationType = {
					chainId: toBigInt(input.chainId),
					address: hexToBytes(
						input.address,
						20,
					) as AuthorizationType["address"],
					nonce: toBigInt(input.nonce),
					yParity: input.yParity,
					r: hexToBytes(input.r, 32),
					s: hexToBytes(input.s, 32),
				};
				Authorization.validate(auth);
				return ParseResult.succeed(auth);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, input, (e as Error).message),
				);
			}
		},
		encode: (auth) => {
			const result: AuthorizationInput = {
				chainId: auth.chainId.toString(),
				address: toHexString(auth.address),
				nonce: auth.nonce.toString(),
				yParity: auth.yParity,
				r: toHexString(auth.r),
				s: toHexString(auth.s),
			};
			return ParseResult.succeed(result);
		},
	}).annotations({ identifier: "Authorization.Rpc" });

function toBigInt(value: string | number | bigint): bigint {
	if (typeof value === "bigint") return value;
	if (typeof value === "number") return BigInt(value);
	if (value.startsWith("0x")) return BigInt(value);
	return BigInt(value);
}

function hexToBytes(hex: string, expectedLength: number): Uint8Array {
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (cleanHex.length !== expectedLength * 2) {
		throw new Error(
			`Expected ${expectedLength} bytes, got ${cleanHex.length / 2}`,
		);
	}
	const bytes = new Uint8Array(expectedLength);
	for (let i = 0; i < expectedLength; i++) {
		bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

function toHexString(bytes: Uint8Array): string {
	return (
		"0x" +
		Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
}
