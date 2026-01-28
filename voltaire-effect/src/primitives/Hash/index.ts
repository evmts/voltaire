/**
 * @module Hash
 * @description Effect Schemas for 32-byte Ethereum hash values.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 *
 * function verifyHash(expected: Hash.HashType, actual: Hash.HashType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Hash.Hex` | hex string | HashType |
 * | `Hash.Bytes` | Uint8Array | HashType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const hash = S.decodeSync(Hash.Hex)('0x' + 'ab'.repeat(32))
 *
 * // Encode (format output)
 * const hex = S.encodeSync(Hash.Hex)(hash)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Hash.equals(a, b)     // boolean
 * Hash.isZero(hash)     // boolean
 * Hash.clone(hash)      // HashType
 * Hash.concat(a, b)     // HashType
 * Hash.slice(hash, s, e) // Uint8Array
 * ```
 *
 * @since 0.1.0
 */

export type { HashType } from "@tevm/voltaire/Hash";

// Re-export constants
export { SIZE, ZERO } from "@tevm/voltaire/Hash";

// Re-export DI factory functions for advanced use cases
// Access via: Hash.Keccak256, Hash.MerkleRoot, etc.
// Note: These are runtime exports that TypeScript types don't fully capture
import { Hash as HashNamespace } from "@tevm/voltaire/functional";
const _HashNs = HashNamespace as Record<string, unknown>;
export const Concat = _HashNs["Concat"] as typeof HashNamespace.concat;
export const Keccak256 = _HashNs["Keccak256"] as (
	keccak: { keccak256: (data: Uint8Array) => Uint8Array },
) => (data: Uint8Array | string) => import("@tevm/voltaire/Hash").HashType;
export const Keccak256Hex = _HashNs["Keccak256Hex"] as (
	keccak: { keccak256: (data: Uint8Array) => Uint8Array },
) => (hex: string) => import("@tevm/voltaire/Hash").HashType;
export const Keccak256String = _HashNs["Keccak256String"] as (
	keccak: { keccak256: (data: Uint8Array) => Uint8Array },
) => (str: string) => import("@tevm/voltaire/Hash").HashType;
export const MerkleRoot = _HashNs["MerkleRoot"] as (
	keccak: { keccak256: (data: Uint8Array) => Uint8Array },
) => (leaves: readonly Uint8Array[]) => import("@tevm/voltaire/Hash").HashType;

// Schemas
export { Bytes } from "./Bytes.js";
export { Hex } from "./Hex.js";

// Constructors (fallible)
export { from } from "./from.js";
export { fromBytes } from "./fromBytes.js";
export { fromHex } from "./fromHex.js";

// Validation
export { assert } from "./assert.js";
export { isHash } from "./isHash.js";
export { isValidHex } from "./isValidHex.js";
export { isZero } from "./isZero.js";

// Operations
export { clone } from "./clone.js";
export { concat } from "./concat.js";
export { equals } from "./equals.js";
export { slice } from "./slice.js";

// Conversions
export { format } from "./format.js";
export { toBytes } from "./toBytes.js";
export { toHex } from "./toHex.js";
export { toString } from "./toString.js";

// Crypto
export { keccak256, keccak256Hex, keccak256String } from "./keccak256.js";
export { merkleRoot } from "./merkleRoot.js";
export { random } from "./random.js";
