/**
 * @fileoverview Effect Schema for Ethereum address hex string encoding.
 * Provides bidirectional transformation between hex strings and AddressType.
 *
 * @module Hex
 * @since 0.1.0
 */

import { Address, type AddressType } from "@tevm/voltaire/Address";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { AddressTypeSchema } from "./AddressSchema.js";

// Pre-computed example addresses for schema annotations
const EXAMPLE_ADDRESSES: readonly [AddressType, AddressType] = [
	Address("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"),
	Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
] as const;

/**
 * Schema for Address encoded as a hex string.
 *
 * @description
 * Transforms hex strings to AddressType and vice versa.
 * Accepts lowercase, uppercase, or checksummed hex input.
 * Encodes to lowercase hex.
 *
 * @example Decoding
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 *
 * const addr = S.decodeSync(Address.Hex)('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Address.Hex)(addr)
 * // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<AddressType, string> = S.transformOrFail(
	S.String,
	AddressTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(Address(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (addr, _options, _ast) => {
			return ParseResult.succeed(Address.toHex(addr));
		},
	},
).annotations({
	identifier: "Address.Hex",
	title: "Ethereum Address",
	description:
		"A 20-byte Ethereum address as a hex string. Accepts checksummed, lowercase, or uppercase.",
	examples: EXAMPLE_ADDRESSES,
	message: () =>
		"Invalid Ethereum address: expected 40 hex characters with 0x prefix",
});
