/**
 * @module BaseFeePerGas
 * @description Effect Schemas for EIP-1559 base fee per gas.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as BaseFeePerGas from 'voltaire-effect/primitives/BaseFeePerGas'
 *
 * function processBaseFee(fee: BaseFeePerGas.BaseFeePerGasType) {
 *   // ...
 * }
 * ```
 *
 * The base fee is a protocol-determined minimum fee per gas unit.
 * It adjusts dynamically based on network congestion (±12.5% per block).
 * The base fee is burned, not paid to validators.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `BaseFeePerGas.BigInt` | bigint (wei) | BaseFeePerGasType |
 * | `BaseFeePerGas.Gwei` | number/bigint (gwei) | BaseFeePerGasType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as BaseFeePerGas from 'voltaire-effect/primitives/BaseFeePerGas'
 * import * as S from 'effect/Schema'
 *
 * // From wei
 * const baseFee = S.decodeSync(BaseFeePerGas.BigInt)(20000000000n)
 *
 * // From gwei (more ergonomic)
 * const baseFee2 = S.decodeSync(BaseFeePerGas.Gwei)(20)
 *
 * // Convert to gwei for display
 * const gwei = BaseFeePerGas.toGwei(baseFee) // 20n
 * ```
 *
 * @since 0.1.0
 */

export { type BaseFeePerGasType, BigInt } from "./BigInt.js";
export { Gwei } from "./Gwei.js";
export { toGwei } from "./toGwei.js";
