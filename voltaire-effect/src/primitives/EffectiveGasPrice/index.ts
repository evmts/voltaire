/**
 * @module EffectiveGasPrice
 * @description Effect Schemas for EIP-1559 effective gas price.
 *
 * The effective gas price is what's actually paid per gas unit.
 * It's calculated as: min(baseFee + priorityFee, maxFeePerGas)
 * This value appears in transaction receipts.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `EffectiveGasPrice.BigInt` | bigint (wei) | EffectiveGasPriceType |
 * | `EffectiveGasPrice.Gwei` | number/bigint (gwei) | EffectiveGasPriceType |
 *
 * ## Pure Functions
 *
 * | Function | Description |
 * |----------|-------------|
 * | `calculate(baseFee, priorityFee, maxFee)` | Compute effective price |
 * | `toGwei(price)` | Convert to gwei |
 * | `equals(a, b)` | Compare for equality |
 * | `compare(a, b)` | Compare ordering |
 *
 * ## Usage
 *
 * ```typescript
 * import * as EffectiveGasPrice from 'voltaire-effect/primitives/EffectiveGasPrice'
 * import * as S from 'effect/Schema'
 *
 * // Calculate from EIP-1559 params
 * const baseFee = 20n * 10n**9n
 * const priorityFee = 2n * 10n**9n
 * const maxFee = 30n * 10n**9n
 * const effective = EffectiveGasPrice.calculate(baseFee, priorityFee, maxFee)
 *
 * // From receipt
 * const price = S.decodeSync(EffectiveGasPrice.BigInt)(22000000000n)
 * ```
 *
 * @since 0.1.0
 */

export { BigInt, type EffectiveGasPriceType } from "./BigInt.js";
export { calculate } from "./calculate.js";
export { compare } from "./compare.js";
export { equals } from "./equals.js";
export { Gwei } from "./Gwei.js";
export { toGwei } from "./toGwei.js";
