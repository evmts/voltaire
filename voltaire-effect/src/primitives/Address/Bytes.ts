/**
 * @fileoverview Effect Schema for creating Ethereum addresses from byte arrays.
 * Provides bidirectional transformation between Uint8Array and AddressType.
 *
 * @module Bytes
 * @since 0.1.0
 */

import { Address, type AddressType } from "@tevm/voltaire/Address";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Internal schema declaration for AddressType.
 * Validates that a value is a 20-byte Uint8Array with the Address brand.
 *
 * @internal
 */
const AddressTypeSchema = S.declare<AddressType>(
	(u): u is AddressType => u instanceof Uint8Array && u.length === 20,
	{ identifier: "Address" },
);

/**
 * Schema for Address encoded as bytes.
 *
 * @description
 * Transforms Uint8Array (exactly 20 bytes) to AddressType and vice versa.
 *
 * @example Decoding
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 *
 * const bytes = new Uint8Array(20).fill(0xab)
 * const addr = S.decodeSync(Address.Bytes)(bytes)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(Address.Bytes)(addr)
 * // Uint8Array(20)
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<AddressType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	AddressTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(Address.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (addr, _options, _ast) => {
			return ParseResult.succeed(Address.toBytes(addr));
		},
	},
).annotations({ identifier: "Address.Bytes" });
