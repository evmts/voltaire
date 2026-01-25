/**
 * @module CallData
 * @description Effect Schemas for EVM transaction call data.
 *
 * Call data is the input data sent with a transaction to a smart contract,
 * containing function selector and encoded arguments.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `CallData.Hex` | hex string | CallDataType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as CallData from 'voltaire-effect/primitives/CallData'
 * import * as S from 'effect/Schema'
 *
 * // From hex string
 * const data = S.decodeSync(CallData.Hex)('0xa9059cbb...')
 *
 * // Empty call data
 * const emptyData = CallData.empty()
 *
 * // Encode back to hex
 * const hex = S.encodeSync(CallData.Hex)(data)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * CallData.empty()  // empty call data (0x)
 * ```
 *
 * @since 0.1.0
 */

export { empty } from "./empty.js";
export { type CallDataType, Hex } from "./Hex.js";
