/**
 * @module MaxPriorityFeePerGas
 * @description Effect Schemas for EIP-1559 priority fee (tip).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as MaxPriorityFeePerGas from 'voltaire-effect/primitives/MaxPriorityFeePerGas'
 *
 * function setTip(tip: MaxPriorityFeePerGas.MaxPriorityFeePerGasType) {
 *   // ...
 * }
 * ```
 *
 * The priority fee is paid to validators to incentivize transaction inclusion.
 * Higher tips during congestion lead to faster inclusion.
 *
 * Typical values:
 * - Low priority: 1-2 gwei
 * - Medium priority: 2-3 gwei
 * - High priority: 5+ gwei
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `MaxPriorityFeePerGas.BigInt` | bigint (wei) | MaxPriorityFeePerGasType |
 * | `MaxPriorityFeePerGas.Gwei` | number/bigint (gwei) | MaxPriorityFeePerGasType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as MaxPriorityFeePerGas from 'voltaire-effect/primitives/MaxPriorityFeePerGas'
 * import * as S from 'effect/Schema'
 *
 * // From wei
 * const tip = S.decodeSync(MaxPriorityFeePerGas.BigInt)(2000000000n)
 *
 * // From gwei (more ergonomic)
 * const tip2 = S.decodeSync(MaxPriorityFeePerGas.Gwei)(2)
 *
 * // Convert to gwei for display
 * const gwei = MaxPriorityFeePerGas.toGwei(tip) // 2n
 * ```
 *
 * @since 0.1.0
 */

export { BigInt, type MaxPriorityFeePerGasType } from "./BigInt.js";
export { Gwei } from "./Gwei.js";
export { toGwei } from "./toGwei.js";
