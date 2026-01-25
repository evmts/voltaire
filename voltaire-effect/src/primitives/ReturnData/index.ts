/**
 * ReturnData module for Effect-based EVM return data handling.
 *
 * Provides Effect-wrapped operations for working with data returned from
 * EVM contract calls and transactions.
 *
 * @example
 * ```typescript
 * import * as ReturnData from 'voltaire-effect/primitives/ReturnData'
 * import * as Effect from 'effect/Effect'
 *
 * // From hex string
 * const data1 = ReturnData.fromHex('0xabcd1234')
 *
 * // From bytes
 * const data2 = ReturnData.fromBytes(new Uint8Array([0xab, 0xcd]))
 *
 * Effect.runSync(data1)
 * ```
 *
 * @module
 * @since 0.0.1
 */
export { Schema, type ReturnDataType } from './ReturnDataSchema.js'
export { from, fromHex, fromBytes, ReturnDataError } from './from.js'
