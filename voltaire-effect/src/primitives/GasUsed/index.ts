/**
 * @module GasUsed
 * @description Effect Schemas for tracking consumed gas.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as GasUsed from 'voltaire-effect/primitives/GasUsed'
 *
 * function getTransactionCost(used: GasUsed.GasUsedType, price: bigint): bigint {
 *   // ...
 * }
 * ```
 *
 * GasUsed represents the actual amount of gas consumed during transaction
 * execution. This value is included in transaction receipts.
 *
 * Fee calculation: fee = gasUsed × effectiveGasPrice
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `GasUsed.BigInt` | bigint | GasUsedType |
 * | `GasUsed.Number` | number | GasUsedType |
 *
 * ## Pure Functions
 *
 * | Function | Description |
 * |----------|-------------|
 * | `calculateCost(gasUsed, gasPrice)` | Calculate transaction fee |
 *
 * ## Usage
 *
 * ```typescript
 * import * as GasUsed from 'voltaire-effect/primitives/GasUsed'
 * import * as S from 'effect/Schema'
 *
 * const used = S.decodeSync(GasUsed.BigInt)(21000n)
 * const cost = GasUsed.calculateCost(used, 20_000_000_000n)
 * ```
 *
 * @since 0.1.0
 */

export { BigInt, type GasUsedType } from "./BigInt.js";
export { calculateCost } from "./calculateCost.js";
export { Number } from "./Number.js";
