/**
 * @module Hex
 * @description Effect Schemas for Ethereum hex strings.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 *
 * function processData(data: Hex.HexType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Hex.String` | string | HexType |
 * | `Hex.Bytes` | Uint8Array | HexType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const hex = S.decodeSync(Hex.String)('0xdeadbeef')
 *
 * // Encode (format output)
 * const str = S.encodeSync(Hex.String)(hex)
 *
 * // From bytes
 * const hexFromBytes = S.decodeSync(Hex.Bytes)(new Uint8Array([0xde, 0xad]))
 * const bytes = S.encodeSync(Hex.Bytes)(hex)
 * ```
 *
 * ## API Design
 *
 * This module follows Effect best practices for function signatures:
 *
 * ### Direct Return (Infallible Operations)
 * Operations that cannot fail return their value directly:
 * - `clone(hex)` - HexType
 * - `isHex(str)` - boolean
 * - `isSized(hex, size)` - boolean
 * - `zero(size)` - HexType
 * - `random(size)` - HexType
 *
 * ### Effect Return (Fallible Operations)
 * Operations that can fail return Effect with typed error:
 * - Schema decode/encode operations via `S.decodeSync(Hex.String)(...)` etc.
 *
 * @example
 * ```typescript
 * // Infallible - use directly
 * const cloned = Hex.clone(hex);
 * const isValid = Hex.isHex('0x1234');
 * const zeros = Hex.zero(32);
 * const rand = Hex.random(16);
 *
 * // Fallible - use Schema
 * const parsed = S.decodeSync(Hex.String)('0x...');
 * ```
 *
 * @since 0.1.0
 */

export type { Hex as HexBrand, HexType } from "@tevm/voltaire/Hex";

// Schemas
export { Bytes } from "./Bytes.js";
export { String } from "./String.js";

// Pure functions
export { clone } from "./clone.js";
export { isHex } from "./isHex.js";
export { isSized } from "./isSized.js";
export { random } from "./random.js";
export { zero } from "./zero.js";
