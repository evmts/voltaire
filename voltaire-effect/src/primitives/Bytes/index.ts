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
 * ## API Design
 *
 * This module follows Effect best practices for function signatures:
 *
 * ### Direct Return (Infallible Operations)
 * Operations that cannot fail return their value directly:
 * - `equals(a, b)` - boolean
 * - `concat(...)` - BytesType
 * - `size(bytes)` - number
 * - `isBytes(value)` - boolean
 * - `random(size)` - BytesType
 * - `toString(bytes)` - string
 *
 * ### Effect Return (Fallible Operations)
 * Operations that can fail return Effect with typed error:
 * - Schema decode/encode operations via `S.decodeSync(Bytes.Hex)(...)` etc.
 *
 * @example
 * ```typescript
 * // Infallible - use directly
 * const areEqual = Bytes.equals(a, b);
 * const combined = Bytes.concat(a, b, c);
 * const len = Bytes.size(bytes);
 * const valid = Bytes.isBytes(value);
 * const rand = Bytes.random(32);
 * const str = Bytes.toString(bytes);
 *
 * // Fallible - use Schema
 * const parsed = S.decodeSync(Bytes.Hex)('0x...');
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
