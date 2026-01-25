/**
 * @module Hash
 * @description Effect Schemas for 32-byte Ethereum hash values.
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

// Schemas
export { Hex } from "./Hex.js";
export { Bytes } from "./Bytes.js";

// For backward compatibility
export { Hex as Schema } from "./Hex.js";
export { Hex as HashSchema } from "./Hex.js";

// Pure functions
export { assert } from "./assert.js";
export { clone } from "./clone.js";
export { format } from "./format.js";
export { isValidHex } from "./isValidHex.js";
export { isZero } from "./isZero.js";
export { keccak256, keccak256Hex, keccak256String } from "./keccak256.js";
export { merkleRoot } from "./merkleRoot.js";
export { random } from "./random.js";
