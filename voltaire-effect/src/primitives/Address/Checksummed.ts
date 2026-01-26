/**
 * @fileoverview Effect Schema for Ethereum address checksummed encoding (EIP-55).
 * Provides bidirectional transformation with KeccakService dependency for encoding.
 *
 * @module Checksummed
 * @since 0.1.0
 */

import { Address, type AddressType } from "@tevm/voltaire/Address";
import * as Effect from "effect/Effect";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { KeccakService } from "../../crypto/Keccak256/index.js";
import { AddressTypeSchema } from "./AddressSchema.js";

/**
 * Schema for Address encoded as an EIP-55 checksummed hex string.
 *
 * @description
 * Transforms checksummed hex strings to AddressType and vice versa.
 * - **Decode**: Validates that input has correct EIP-55 checksum
 * - **Encode**: Produces checksummed output (requires KeccakService)
 *
 * Unlike `Address.Hex`, this schema validates checksum on decode and
 * requires `KeccakService` for encoding operations.
 *
 * @example Decoding (validates checksum)
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 *
 * // Valid checksummed address - succeeds
 * const addr = S.decodeSync(Address.Checksummed)('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 *
 * // Invalid checksum - throws
 * S.decodeSync(Address.Checksummed)('0x742d35cc6634c0532925a3b844bc9e7595f251e3') // Error!
 * ```
 *
 * @example Encoding (requires KeccakService)
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 * import * as Effect from 'effect/Effect'
 * import { KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 *
 * const addr = S.decodeSync(Address.Hex)('0x742d35cc6634c0532925a3b844bc9e7595f251e3')
 * const program = S.encode(Address.Checksummed)(addr)
 * const checksummed = await Effect.runPromise(program.pipe(Effect.provide(KeccakLive)))
 * // "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
 * ```
 *
 * @since 0.1.0
 */
export const Checksummed: S.Schema<AddressType, string, KeccakService> =
	S.transformOrFail(S.String, AddressTypeSchema, {
		strict: true,
		decode: (s, _options, ast) => {
			try {
				const addr = Address(s);
				if (!Address.isValidChecksum(s)) {
					return ParseResult.fail(
						new ParseResult.Type(ast, s, `Invalid EIP-55 checksum: ${s}`),
					);
				}
				return ParseResult.succeed(addr);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (addr, _options, _ast) =>
			Effect.gen(function* () {
				const keccak = yield* KeccakService;
				const hex = Address.toHex(addr).slice(2).toLowerCase();
				const hashResult = yield* keccak.hash(new TextEncoder().encode(hex));
				const hashHex = Array.from(hashResult)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("");

				let checksummed = "0x";
				for (let i = 0; i < hex.length; i++) {
					const char = hex[i];
					if (char >= "a" && char <= "f") {
						const hashNibble = Number.parseInt(hashHex[i], 16);
						checksummed += hashNibble >= 8 ? char.toUpperCase() : char;
					} else {
						checksummed += char;
					}
				}
				return checksummed;
			}),
	}).annotations({ identifier: "Address.Checksummed" });
