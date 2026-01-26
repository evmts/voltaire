/**
 * @fileoverview EIP-191 personal message hashing.
 * @module Signature/hashMessage
 * @since 0.0.1
 */

import type { HashType } from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";
import { KeccakService } from "../Keccak256/index.js";

/**
 * EIP-191 prefix for personal_sign messages.
 * @see https://eips.ethereum.org/EIPS/eip-191
 */
const EIP191_PREFIX = "\x19Ethereum Signed Message:\n";

/**
 * Hashes a message according to EIP-191 personal_sign format.
 *
 * @description
 * Creates the hash: keccak256("\x19Ethereum Signed Message:\n" + len + message)
 *
 * This is the standard format used by `personal_sign` in Ethereum wallets.
 * The prefix prevents signed messages from being valid transactions.
 *
 * @param message - The message to hash (string or bytes; strings starting with 0x are treated as hex)
 * @returns Effect containing the 32-byte hash
 *
 * @example
 * ```typescript
 * import { hashMessage } from 'voltaire-effect/crypto/Signature'
 * import { KeccakLive } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = hashMessage('Hello, Ethereum!').pipe(Effect.provide(KeccakLive))
 * const hash = await Effect.runPromise(program)
 * ```
 *
 * @see https://eips.ethereum.org/EIPS/eip-191
 * @since 0.0.1
 */
export const hashMessage = (
	message: string | Uint8Array,
): Effect.Effect<HashType, never, KeccakService> =>
	Effect.gen(function* () {
		const keccak = yield* KeccakService;

		// Convert message to bytes
		let messageBytes: Uint8Array;
		if (typeof message === "string") {
			if (message.startsWith("0x")) {
				// Hex string
				const hexStr = message.slice(2);
				messageBytes = new Uint8Array(hexStr.length / 2);
				for (let i = 0; i < messageBytes.length; i++) {
					messageBytes[i] = Number.parseInt(hexStr.slice(i * 2, i * 2 + 2), 16);
				}
			} else {
				// Regular string
				messageBytes = new TextEncoder().encode(message);
			}
		} else {
			messageBytes = message;
		}

		// Create length string
		const lenStr = String(messageBytes.length);
		const lenBytes = new TextEncoder().encode(lenStr);

		// Prefix bytes
		const prefixBytes = new TextEncoder().encode(EIP191_PREFIX);

		// Concatenate: prefix + len + message
		const totalLength =
			prefixBytes.length + lenBytes.length + messageBytes.length;
		const data = new Uint8Array(totalLength);
		data.set(prefixBytes, 0);
		data.set(lenBytes, prefixBytes.length);
		data.set(messageBytes, prefixBytes.length + lenBytes.length);

		// Hash the complete message
		return yield* keccak.hash(data);
	});
