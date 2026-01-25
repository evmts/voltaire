/**
 * @module Balance
 * @description Effect Schemas for Ethereum account balances in Wei.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Balance from 'voltaire-effect/primitives/Balance'
 *
 * function getAccountBalance(address: string): Balance.BalanceType {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Balance.BigInt` | bigint | BalanceType |
 * | `Balance.String` | string | BalanceType |
 * | `Balance.Number` | number | BalanceType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Balance from 'voltaire-effect/primitives/Balance'
 * import * as S from 'effect/Schema'
 *
 * // Decode from bigint
 * const balance = S.decodeSync(Balance.BigInt)(1000000000000000000n) // 1 ETH
 *
 * // Decode from string
 * const fromStr = S.decodeSync(Balance.String)('1000000000000000000')
 *
 * // Encode back to bigint
 * const wei = S.encodeSync(Balance.BigInt)(balance)
 * ```
 *
 * @since 0.1.0
 */

export { BigInt, type BalanceType } from "./BigInt.js";
export { Number } from "./Number.js";
export { String } from "./String.js";
