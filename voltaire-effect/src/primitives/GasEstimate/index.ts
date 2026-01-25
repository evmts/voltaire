/**
 * @module GasEstimate
 * @description Effect Schemas for pre-execution gas estimation.
 *
 * Gas estimates predict the gas required for a transaction before execution.
 * The `eth_estimateGas` RPC call returns this value. Estimates should include
 * a safety buffer (typically 10-20%) to account for state changes.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `GasEstimate.BigInt` | bigint | GasEstimateType |
 * | `GasEstimate.Number` | number | GasEstimateType |
 *
 * ## Pure Functions
 *
 * | Function | Description |
 * |----------|-------------|
 * | `withBuffer(estimate, percent)` | Add safety buffer |
 * | `toGasLimit(estimate)` | Convert to gas limit |
 *
 * ## Usage
 *
 * ```typescript
 * import * as GasEstimate from 'voltaire-effect/primitives/GasEstimate'
 * import * as S from 'effect/Schema'
 *
 * const estimate = S.decodeSync(GasEstimate.BigInt)(52000n)
 * const buffered = GasEstimate.withBuffer(estimate, 20) // +20%
 * const gasLimit = GasEstimate.toGasLimit(buffered)
 * ```
 *
 * @since 0.1.0
 */

export { BigInt, type GasEstimateType } from "./BigInt.js";
export { Number } from "./Number.js";
export { type GasLimitType, toGasLimit } from "./toGasLimit.js";
export { withBuffer } from "./withBuffer.js";
