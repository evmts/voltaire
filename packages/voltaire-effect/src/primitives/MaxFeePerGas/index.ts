/**
 * @module MaxFeePerGas
 * @description Effect Schemas for EIP-1559 maximum fee per gas.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as MaxFeePerGas from 'voltaire-effect/primitives/MaxFeePerGas'
 *
 * function estimateMaxFee(baseFee: MaxFeePerGas.MaxFeePerGasType) {
 *   // ...
 * }
 * ```
 *
 * MaxFeePerGas is the maximum total fee per gas a user is willing to pay.
 * The actual fee paid is: min(baseFee + priorityFee, maxFeePerGas)
 * Setting maxFeePerGas protects users from sudden base fee spikes.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `MaxFeePerGas.BigInt` | bigint (wei) | MaxFeePerGasType |
 * | `MaxFeePerGas.Gwei` | number/bigint (gwei) | MaxFeePerGasType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as MaxFeePerGas from 'voltaire-effect/primitives/MaxFeePerGas'
 * import * as S from 'effect/Schema'
 *
 * // From wei
 * const maxFee = S.decodeSync(MaxFeePerGas.BigInt)(50000000000n)
 *
 * // From gwei (more ergonomic)
 * const maxFee2 = S.decodeSync(MaxFeePerGas.Gwei)(50)
 *
 * // Convert to gwei for display
 * const gwei = MaxFeePerGas.toGwei(maxFee) // 50n
 * ```
 *
 * @since 0.1.0
 */

export { BigInt, type MaxFeePerGasType } from "./BigInt.js";
export { Gwei } from "./Gwei.js";
export { toGwei } from "./toGwei.js";
