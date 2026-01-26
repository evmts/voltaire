/**
 * @module Gas
 * @description Effect Schemas for EVM gas amounts.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Gas from 'voltaire-effect/primitives/Gas'
 *
 * function setGasLimit(limit: Gas.GasType): void {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `Gas.Number` | number | GasType | Gas amount as number |
 * | `Gas.BigInt` | bigint | GasType | Gas amount as bigint |
 * | `Gas.Hex` | string | GasType | Hex-encoded gas amount |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Gas from 'voltaire-effect/primitives/Gas'
 * import * as S from 'effect/Schema'
 *
 * // Decode from number
 * const gas = S.decodeSync(Gas.Number)(21000)
 *
 * // Decode from hex
 * const fromHex = S.decodeSync(Gas.Hex)('0x5208')
 *
 * // Encode back
 * const num = S.encodeSync(Gas.Number)(gas)
 * ```
 *
 * ## Common Gas Values
 *
 * - 21000: Simple ETH transfer
 * - 32000: Contract creation base cost
 * - ~100,000-500,000: Typical contract interactions
 *
 * @since 0.1.0
 */

export { BigInt } from "./BigInt.js";
export { Hex } from "./Hex.js";
// Schemas
export { type GasType, Number } from "./Number.js";
