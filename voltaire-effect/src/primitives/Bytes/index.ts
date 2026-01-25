/**
 * @module Bytes
 * @description Effect Schemas for arbitrary byte arrays.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Bytes.Hex` | string | BytesType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Bytes from 'voltaire-effect/primitives/Bytes'
 * import * as S from 'effect/Schema'
 *
 * // Decode from hex string
 * const bytes = S.decodeSync(Bytes.Hex)('0xdeadbeef')
 * // Uint8Array([0xde, 0xad, 0xbe, 0xef])
 *
 * // Encode to hex string
 * const hex = S.encodeSync(Bytes.Hex)(bytes)
 * // "0xdeadbeef"
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Bytes.equals(a, b)     // Effect<boolean>
 * Bytes.concat(...)      // Effect<BytesType>
 * Bytes.slice(bytes, start, end) // Effect<BytesType>
 * Bytes.size(bytes)      // Effect<number>
 * Bytes.isBytes(value)   // Effect<boolean>
 * ```
 *
 * @since 0.1.0
 */

export type { BytesType } from "@tevm/voltaire/Bytes";

// Schemas
export { Hex } from "./Hex.js";
/** @deprecated Use Bytes.Hex instead */
export { Schema } from "./BytesSchema.js";

// Pure functions
export { isBytes } from "./isBytes.js";
export { random } from "./random.js";

// Deprecated - use S.decodeSync(Bytes.Hex) instead
/** @deprecated Use S.decodeSync(Bytes.Hex) instead */
/** @deprecated Use S.decodeSync(Bytes.Hex) instead */
/** @deprecated Use S.decodeSync(Bytes.Hex) instead */
/** @deprecated Use S.encodeSync(Bytes.Hex) instead */
/** @deprecated Use pure function from base library */
