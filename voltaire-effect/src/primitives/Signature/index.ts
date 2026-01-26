/**
 * @module Signature
 * @description Effect Schemas for cryptographic signatures (secp256k1, p256, ed25519).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * function verifySignature(sig: Signature.SignatureType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `Signature.Hex` | hex string | SignatureType | 64/65-byte signature as hex |
 * | `Signature.Bytes` | Uint8Array | SignatureType | Raw signature bytes |
 * | `Signature.Compact` | Uint8Array | SignatureType | EIP-2098 compact format |
 * | `Signature.DER` | Uint8Array | SignatureType | DER encoding |
 * | `Signature.Rpc` | {r, s, yParity?, v?} | SignatureType | Ethereum RPC format |
 * | `Signature.Tuple` | [yParity, r, s] | SignatureType | Tuple format |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const sig = S.decodeSync(Signature.Hex)('0x' + 'ab'.repeat(32) + 'cd'.repeat(32) + '1b')
 *
 * // Encode (format output)
 * const hex = S.encodeSync(Signature.Hex)(sig)
 *
 * // Convert between formats
 * const compact = S.encodeSync(Signature.Compact)(sig)
 * const rpc = S.encodeSync(Signature.Rpc)(sig)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Signature.equals(a, b)       // boolean - compare signatures
 * Signature.is(value)          // type guard for SignatureType
 * Signature.isSignature(value) // alias for is
 * Signature.isCanonical(sig)   // boolean - check if s <= n/2
 * Signature.getAlgorithm(sig)  // 'secp256k1' | 'p256' | 'ed25519'
 * Signature.normalize(sig)     // SignatureType - normalize to canonical form
 * Signature.toBytes(sig)       // Uint8Array - raw bytes
 * Signature.toCompact(sig)     // Uint8Array - EIP-2098 compact
 * Signature.toHex(sig)         // string - hex encoding
 * ```
 *
 * ## Effect-wrapped Functions (fallible operations)
 *
 * ```typescript
 * import * as Effect from 'effect/Effect'
 *
 * Signature.getR(sig)          // Effect<HashType, InvalidAlgorithmError>
 * Signature.getS(sig)          // Effect<HashType, InvalidAlgorithmError>
 * Signature.getV(sig)          // Effect<number | undefined, InvalidAlgorithmError>
 * Signature.verify(sig, hash, pubkey) // Effect<boolean, InvalidAlgorithmError>
 * ```
 *
 * @since 0.1.0
 */

export { Bytes } from "./Bytes.js";
export { Compact } from "./Compact.js";
export { DER } from "./DER.js";
export { getAlgorithm } from "./getAlgorithm.js";
export { Hex } from "./Hex.js";
// Pure functions (infallible)
export { is } from "./is.js";
export { isCanonical } from "./isCanonical.js";
export { isSignature } from "./isSignature.js";
export { normalize } from "./normalize.js";
export { Rpc } from "./Rpc.js";
// Schemas
export { SignatureTypeSchema } from "./SignatureSchema.js";
export { Tuple } from "./Tuple.js";
export { toCompact } from "./toCompact.js";

// Effect-wrapped functions (fallible operations on valid signatures)

// Re-export types from voltaire
export type {
	SignatureAlgorithm,
	SignatureType,
} from "@tevm/voltaire/Signature";
