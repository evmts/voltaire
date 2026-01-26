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
).annotations({ identifier: "Address.Hex" });
