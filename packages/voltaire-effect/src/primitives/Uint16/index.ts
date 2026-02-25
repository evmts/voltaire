/**
 * @module Uint16
 * @description Effect Schemas for 16-bit unsigned integers (0-65535).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Uint16 from 'voltaire-effect/primitives/Uint16'
 *
 * function setPort(port: Uint16.Uint16Type) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Uint16.String` | decimal string | Uint16Type |
 * | `Uint16.Number` | number | Uint16Type |
 * | `Uint16.BigInt` | bigint | Uint16Type |
 * | `Uint16.Hex` | hex string | Uint16Type |
 * | `Uint16.Bytes` | Uint8Array | Uint16Type |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Uint16 from 'voltaire-effect/primitives/Uint16'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const value = S.decodeSync(Uint16.Number)(65535)
 *
 * // Encode (format output)
 * const num = S.encodeSync(Uint16.Number)(value)
 * const hex = S.encodeSync(Uint16.Hex)(value)
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
import { BrandedUint16 } from "@tevm/voltaire";
import type { Uint16Type } from "./Uint16Schema.js";

export const equals = BrandedUint16.equals;
export const plus = BrandedUint16.plus;
export const minus = BrandedUint16.minus;
export const times = BrandedUint16.times;
export const toNumber = BrandedUint16.toNumber;
export const toHex = BrandedUint16.toHex;
export const MAX: Uint16Type = BrandedUint16.MAX;
export const MIN: Uint16Type = BrandedUint16.MIN;
export const ZERO: Uint16Type = BrandedUint16.ZERO;
export const ONE: Uint16Type = BrandedUint16.ONE;

// Type export
export type { Uint16Type } from "./Uint16Schema.js";
