/**
 * @module Uint64
 * @description Effect Schemas for 64-bit unsigned integers (0 to 2^64-1).
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Uint64.String` | decimal string | Uint64Type |
 * | `Uint64.Number` | number | Uint64Type |
 * | `Uint64.BigInt` | bigint | Uint64Type |
 * | `Uint64.Hex` | hex string | Uint64Type |
 * | `Uint64.Bytes` | Uint8Array | Uint64Type |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Uint64 from 'voltaire-effect/primitives/Uint64'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const value = S.decodeSync(Uint64.BigInt)(18446744073709551615n)
 *
 * // Encode (format output)
 * const bigint = S.encodeSync(Uint64.BigInt)(value)
 * const hex = S.encodeSync(Uint64.Hex)(value)
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
import { Uint64 } from "@tevm/voltaire";

export const equals = Uint64.equals;
export const plus = Uint64.plus;
export const minus = Uint64.minus;
export const times = Uint64.times;
export const toBigInt = Uint64.toBigInt;
export const toNumber = Uint64.toNumber;
export const toHex = Uint64.toHex;
export const MAX = Uint64.MAX;
export const MIN = Uint64.MIN;
export const ZERO = Uint64.ZERO;
export const ONE = Uint64.ONE;

// Type export
export type { Uint64Type } from "./Uint64Schema.js";

// Legacy schema export
export { Schema } from "./Uint64Schema.js";
