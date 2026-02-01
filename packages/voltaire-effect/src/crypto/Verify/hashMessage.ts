/**
 * @fileoverview EIP-191 personal message hashing for Effect.
 * @module Verify/hashMessage
 * @since 0.0.1
 */

import type { Keccak256Hash } from "@tevm/voltaire";
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
 * @param message - The message to hash (string or bytes)
 * @returns Effect containing the 32-byte hash, requiring KeccakService
 *
 * @example
 * ```typescript
 * import { hashMessage, KeccakLive } from 'voltaire-effect/crypto/Verify'
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
): Effect.Effect<Keccak256Hash, never, KeccakService> =>
	Effect.gen(function* () {
		const keccak = yield* KeccakService;

		// Convert string to bytes if needed
		const messageBytes =
			typeof message === "string" ? new TextEncoder().encode(message) : message;

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
