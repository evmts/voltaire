/**
 * @fileoverview Verifies a Signature against a message hash and public key.
 * @module Signature/verify
 * @since 0.0.1
 */
import type { HashType } from "@tevm/voltaire/Hash";
import type { PublicKeyType } from "@tevm/voltaire/PublicKey";
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";

/**
 * Verifies a signature against a message hash and public key.
 *
 * @param signature - The signature to verify
 * @param messageHash - The 32-byte hash of the signed message
 * @param publicKey - The public key to verify against
 * @returns True if signature is valid, false otherwise
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const isValid = Signature.verify(sig, messageHash, publicKey)
 * ```
 *
 * @since 0.0.1
 */
export const verify = (
	signature: SignatureType,
	messageHash: HashType,
	publicKey: PublicKeyType,
): boolean => Signature.verify(signature, messageHash, publicKey);
