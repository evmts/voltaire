/**
 * @module Uint32
 * @description Effect Schemas for 32-bit unsigned integers (0-4294967295).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Uint32 from 'voltaire-effect/primitives/Uint32'
 *
 * function setTimestamp(timestamp: Uint32.Uint32Type) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Uint32.String` | decimal string | Uint32Type |
 * | `Uint32.Number` | number | Uint32Type |
 * | `Uint32.BigInt` | bigint | Uint32Type |
 * | `Uint32.Hex` | hex string | Uint32Type |
 * | `Uint32.Bytes` | Uint8Array | Uint32Type |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Uint32 from 'voltaire-effect/primitives/Uint32'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const value = S.decodeSync(Uint32.Number)(4294967295)
 *
 * // Encode (format output)
 * const num = S.encodeSync(Uint32.Number)(value)
 * const hex = S.encodeSync(Uint32.Hex)(value)
 * ```
 *
 * ## Pure Functions
 *
 * - `equals`, `plus`, `minus`, `times`
 * - `toNumber`, `toHex`
 * - Constants: `MAX`, `MIN`, `ZERO`, `ONE`
 *
 * @since 0.1.0
 */

// Schemas
export { BigInt } from "./BigInt.js";
export { Bytes } from "./Bytes.js";
export { Hex } from "./Hex.js";
export { Number } from "./Number.js";
export { String } from "./String.js";

// Re-export pure functions from voltaire
import { BrandedUint32 } from "@tevm/voltaire";

export const equals = BrandedUint32.equals;
export const plus = BrandedUint32.plus;
export const minus = BrandedUint32.minus;
export const times = BrandedUint32.times;
export const toNumber = BrandedUint32.toNumber;
export const toHex = BrandedUint32.toHex;
export const MAX = BrandedUint32.MAX;
export const MIN = BrandedUint32.MIN;
export const ZERO = BrandedUint32.ZERO;
export const ONE = BrandedUint32.ONE;

// Type export
export type { Uint32Type } from "./Uint32Schema.js";
