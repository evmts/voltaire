/**
 * @module ReturnData
 * @description Effect Schemas for EVM return data.
 *
 * Return data is the output from EVM contract calls and transactions.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `ReturnData.Hex` | hex string | ReturnDataType |
 * | `ReturnData.Bytes` | Uint8Array | ReturnDataType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as ReturnData from 'voltaire-effect/primitives/ReturnData'
 * import * as S from 'effect/Schema'
 *
 * // From hex string
 * const data = S.decodeSync(ReturnData.Hex)('0xabcd1234')
 *
 * // From bytes
 * const data2 = S.decodeSync(ReturnData.Bytes)(bytes)
 *
 * // Encode back to hex
 * const hex = S.encodeSync(ReturnData.Hex)(data)
 * ```
 *
 * @since 0.1.0
 */

export { Bytes } from "./Bytes.js";
export { Hex } from "./Hex.js";
export { type ReturnDataType } from "./ReturnDataSchema.js";
