/**
 * @module Uint128
 * @description Effect Schemas for 128-bit unsigned integers (0 to 2^128-1).
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Uint128.String` | decimal string | Uint128Type |
 * | `Uint128.Number` | number | Uint128Type |
 * | `Uint128.BigInt` | bigint | Uint128Type |
 * | `Uint128.Hex` | hex string | Uint128Type |
 * | `Uint128.Bytes` | Uint8Array | Uint128Type |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Uint128 from 'voltaire-effect/primitives/Uint128'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const value = S.decodeSync(Uint128.BigInt)(2n ** 100n)
 *
 * // Encode (format output)
 * const bigint = S.encodeSync(Uint128.BigInt)(value)
 * const hex = S.encodeSync(Uint128.Hex)(value)
 * ```
 *
 * ## Pure Functions
 *
 * - `equals`, `plus`, `minus`, `times`
 * - `toBigInt`, `toNumber`, `toHex`
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
import { BrandedUint128 } from "@tevm/voltaire";

export const equals = BrandedUint128.equals;
export const plus = BrandedUint128.plus;
export const minus = BrandedUint128.minus;
export const times = BrandedUint128.times;
export const toBigInt = BrandedUint128.toBigInt;
export const toNumber = BrandedUint128.toNumber;
export const toHex = BrandedUint128.toHex;
export const MAX = BrandedUint128.MAX;
export const MIN = BrandedUint128.MIN;
export const ZERO = BrandedUint128.ZERO;
export const ONE = BrandedUint128.ONE;

// Type export
export type { Uint128Type } from "./Uint128Schema.js";

// Legacy schema export
export { Schema } from "./Uint128Schema.js";
