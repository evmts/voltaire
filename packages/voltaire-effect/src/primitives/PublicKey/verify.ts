/**
 * @fileoverview Effect-wrapped verify for PublicKey.
 * @module verify
 * @since 0.0.1
 */

import type { HashType } from "@tevm/voltaire/Hash";
import {
	_toHex,
	PublicKey,
	type PublicKeyType,
} from "@tevm/voltaire/PublicKey";
import type { SignatureType } from "@tevm/voltaire/Signature";
import * as Effect from "effect/Effect";

/**
 * Verifies a signature against a public key.
 *
 * @param publicKey - The public key
 * @param hash - Message hash
 * @param signature - ECDSA signature
 * @returns Effect yielding boolean
 *
 * @example
 * ```typescript
 * const valid = Effect.runSync(PublicKey.verify(pk, hash, sig))
 * ```
 *
 * @since 0.0.1
 */
export const verify = (
	publicKey: PublicKeyType,
	hash: HashType,
	signature: SignatureType,
): Effect.Effect<boolean> =>
	Effect.sync(() => PublicKey.verify(_toHex.call(publicKey), hash, signature));
