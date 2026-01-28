/**
 * @fileoverview Creates Signature from Ed25519 bytes.
 * @module Signature/fromEd25519
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";

/**
 * Creates an Ed25519 Signature from 64-byte signature.
 *
 * @param bytes - 64-byte Ed25519 signature
 * @returns SignatureType with ed25519 algorithm
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const sig = Signature.fromEd25519(signatureBytes)
 * ```
 *
 * @since 0.0.1
 */
export const fromEd25519 = (bytes: Uint8Array): SignatureType =>
	Signature.fromEd25519(bytes);
