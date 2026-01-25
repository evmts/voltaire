/**
 * @module Hex
 * @description Effect Schemas for Ethereum hex strings.
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
 * ## Pure Functions
 *
 * ```typescript
 * Hex.equals(a, b)  // Effect<boolean>
 * Hex.isHex(str)    // Effect<boolean>
 * Hex.size(hex)     // Effect<number>
 * Hex.concat(...)   // Effect<HexType>
 * Hex.slice(...)    // Effect<HexType>
 * Hex.pad(...)      // Effect<HexType>
 * Hex.clone(hex)    // Effect<HexType>
 * ```
 *
 * @since 0.1.0
 */

export type { Hex as HexBrand, HexType } from "@tevm/voltaire/Hex";

// Schemas
export { String } from "./String.js";
export { Bytes } from "./Bytes.js";
/** @deprecated Use Hex.String instead */
export { Schema } from "./HexSchema.js";

// Pure functions
export { clone } from "./clone.js";
export { isHex } from "./isHex.js";
export { isSized } from "./isSized.js";
export { random } from "./random.js";
export { zero } from "./zero.js";
