/**
 * @module Bytes
 * @description Effect Schemas for arbitrary byte arrays.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Bytes from 'voltaire-effect/primitives/Bytes'
 *
 * function processBytes(data: Bytes.BytesType) {
 *   // ...
 * }
 * ```
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

// Pure functions
export { concat } from "./concat.js";
export { equals } from "./equals.js";
export { isBytes } from "./isBytes.js";
export { random } from "./random.js";
export { size } from "./size.js";
export { toString } from "./toString.js";
