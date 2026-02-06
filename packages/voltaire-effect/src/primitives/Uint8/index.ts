/**
 * @module Uint8
 * @description Effect Schemas for 8-bit unsigned integers (0-255).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Uint8 from 'voltaire-effect/primitives/Uint8'
 *
 * function setAge(age: Uint8.Uint8Type) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Uint8.String` | decimal string | Uint8Type |
 * | `Uint8.Number` | number | Uint8Type |
 * | `Uint8.BigInt` | bigint | Uint8Type |
 * | `Uint8.Hex` | hex string | Uint8Type |
 * | `Uint8.Bytes` | Uint8Array | Uint8Type |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Uint8 from 'voltaire-effect/primitives/Uint8'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const value = S.decodeSync(Uint8.Number)(255)
 *
 * // Encode (format output)
 * const num = S.encodeSync(Uint8.Number)(value)
 * const hex = S.encodeSync(Uint8.Hex)(value)
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
import { BrandedUint8 } from "@tevm/voltaire";

export const equals = BrandedUint8.equals;
export const plus = BrandedUint8.plus;
export const minus = BrandedUint8.minus;
export const times = BrandedUint8.times;
export const toNumber = BrandedUint8.toNumber;
export const toHex = BrandedUint8.toHex;
export const MAX = BrandedUint8.MAX;
export const MIN = BrandedUint8.MIN;
export const ZERO = BrandedUint8.ZERO;
export const ONE = BrandedUint8.ONE;

// Type export
export type { Uint8Type } from "./Uint8Schema.js";
