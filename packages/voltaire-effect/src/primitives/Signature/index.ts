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
 * Signature.getR(sig)          // Uint8Array - 32-byte R component
 * Signature.getS(sig)          // Uint8Array - 32-byte S component
 * Signature.getV(sig)          // number | undefined - recovery value
 * Signature.normalize(sig)     // SignatureType - normalize to canonical form
 * Signature.toBytes(sig)       // Uint8Array - raw bytes
 * Signature.toCompact(sig)     // Uint8Array - EIP-2098 compact
 * Signature.toDER(sig)         // Uint8Array - DER encoding
 * Signature.toHex(sig)         // string - hex encoding
 * Signature.toRpc(sig)         // { r, s, yParity, v } - RPC format
 * Signature.toTuple(sig)       // [yParity, r, s] - tuple format
 * Signature.verify(sig, hash, pubkey) // boolean - verify signature
 * ```
 *
 * ## Effect-wrapped Functions (fallible parsing)
 *
 * ```typescript
 * import * as Effect from 'effect/Effect'
 *
 * Signature.from(input)        // Effect<SignatureType, Error>
 * Signature.fromHex(hex)       // Effect<SignatureType, Error>
 * Signature.fromBytes(bytes)   // Effect<SignatureType, Error>
 * Signature.fromCompact(bytes) // Effect<SignatureType, Error>
 * Signature.fromDER(bytes)     // Effect<SignatureType, Error>
 * Signature.fromRpc(rpc)       // Effect<SignatureType, Error>
 * Signature.fromTuple(tuple)   // Effect<SignatureType, Error>
 * ```
 *
 * ## Constructor Functions (pure, for known-valid inputs)
 *
 * ```typescript
 * Signature.fromSecp256k1(r, s, v)  // SignatureType
 * Signature.fromP256(r, s)          // SignatureType
 * Signature.fromEd25519(bytes)      // SignatureType
 * ```
 *
 * @since 0.1.0
 */

// Schemas
export { Bytes } from "./Bytes.js";
export { Compact } from "./Compact.js";
export { DER } from "./DER.js";
export { Hex } from "./Hex.js";
export { Rpc } from "./Rpc.js";
export { SignatureTypeSchema } from "./SignatureSchema.js";
export { Tuple } from "./Tuple.js";

// Pure functions (infallible)
export { equals } from "./equals.js";
export { getAlgorithm } from "./getAlgorithm.js";
export { getR } from "./getR.js";
export { getS } from "./getS.js";
export { getV } from "./getV.js";
export { is } from "./is.js";
export { isCanonical } from "./isCanonical.js";
export { isSignature } from "./isSignature.js";
export { normalize } from "./normalize.js";
export { toBytes } from "./toBytes.js";
export { toCompact } from "./toCompact.js";
export { toDER } from "./toDER.js";
export { toHex } from "./toHex.js";
export { toRpc, type RpcSignature } from "./toRpc.js";
export { toTuple, type SignatureTuple } from "./toTuple.js";
export { verify } from "./verify.js";

// Effect-wrapped functions (fallible parsing)
export { from } from "./from.js";
export { fromBytes } from "./fromBytes.js";
export { fromCompact } from "./fromCompact.js";
export { fromDER } from "./fromDER.js";
export { fromHex } from "./fromHex.js";
export { fromRpc } from "./fromRpc.js";
export { fromTuple } from "./fromTuple.js";

// Constructor functions (pure, for known-valid inputs)
export { fromEd25519 } from "./fromEd25519.js";
export { fromP256 } from "./fromP256.js";
export { fromSecp256k1 } from "./fromSecp256k1.js";

// Re-export errors from voltaire
export {
	InvalidAlgorithmError,
	InvalidDERError,
	InvalidSignatureFormatError,
	InvalidSignatureLengthError,
	NonCanonicalSignatureError,
} from "@tevm/voltaire/Signature";

// Re-export types from voltaire
export type {
	SignatureAlgorithm,
	SignatureType,
} from "@tevm/voltaire/Signature";
