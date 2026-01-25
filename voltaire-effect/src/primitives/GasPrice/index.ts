/**
 * @module GasPrice
 * @description Effect Schemas for gas pricing in wei.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as GasPrice from 'voltaire-effect/primitives/GasPrice'
 *
 * function calculateFee(gasUsed: bigint, price: GasPrice.GasPriceType): bigint {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `GasPrice.Number` | number | GasPriceType | Wei value as number |
 * | `GasPrice.BigInt` | bigint | GasPriceType | Wei value as bigint |
 * | `GasPrice.Hex` | string | GasPriceType | Hex-encoded wei value |
 * | `GasPrice.Gwei` | number \| bigint | GasPriceType | Gwei input, stored as wei |
 *
 * ## Usage
 *
 * ```typescript
 * import * as GasPrice from 'voltaire-effect/primitives/GasPrice'
 * import * as S from 'effect/Schema'
 *
 * // Decode from gwei (most common)
 * const price = S.decodeSync(GasPrice.Gwei)(20)
 *
 * // Decode from wei
 * const fromWei = S.decodeSync(GasPrice.BigInt)(20000000000n)
 *
 * // Decode from hex
 * const fromHex = S.decodeSync(GasPrice.Hex)('0x3b9aca00')
 *
 * // Encode back to gwei
 * const gwei = S.encodeSync(GasPrice.Gwei)(price)
 * ```
 *
 * ## Common Units
 *
 * - 1 wei = 1 (smallest unit)
 * - 1 gwei = 1,000,000,000 wei (10^9)
 * - Gas prices are typically expressed in gwei (e.g., "20 gwei")
 *
 * @since 0.1.0
 * @see {@link Gas} for gas units
 */

// Schemas
export { Number, type GasPriceType } from "./Number.js";
export { BigInt } from "./BigInt.js";
export { Hex } from "./Hex.js";
export { Gwei } from "./Gwei.js";
