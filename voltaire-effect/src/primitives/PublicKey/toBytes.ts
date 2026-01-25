/**
 * @fileoverview Effect-wrapped toBytes for PublicKey.
 * @module toBytes
 * @since 0.0.1
 */

import type { PublicKeyType } from "@tevm/voltaire/PublicKey";

/**
 * Returns the raw bytes of a PublicKey.
 *
 * @description
 * This is a pure, synchronous function that returns the underlying 64-byte
 * Uint8Array from a PublicKeyType. Since PublicKeyType is a branded Uint8Array,
 * this operation is always safe and never throws.
 *
 * @param publicKey - The public key
 * @returns 64-byte Uint8Array
 *
 * @example
 * ```typescript
 * const bytes = PublicKey.toBytes(pk)
 * ```
 *
 * @since 0.0.1
 */
export const toBytes = (publicKey: PublicKeyType): Uint8Array => publicKey;
