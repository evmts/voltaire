/**
 * @module RuntimeCode
 * @description Effect Schemas for deployed contract runtime bytecode.
 *
 * Runtime code is the bytecode stored at a contract address after deployment.
 * This is what gets executed when the contract is called.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `RuntimeCode.Hex` | hex string | RuntimeCodeType |
 * | `RuntimeCode.Bytes` | Uint8Array | RuntimeCodeType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as RuntimeCode from 'voltaire-effect/primitives/RuntimeCode'
 * import * as S from 'effect/Schema'
 *
 * // From hex string
 * const code = S.decodeSync(RuntimeCode.Hex)('0x6080604052...')
 *
 * // From bytes
 * const code2 = S.decodeSync(RuntimeCode.Bytes)(bytes)
 *
 * // Encode back to hex
 * const hex = S.encodeSync(RuntimeCode.Hex)(code)
 * ```
 *
 * @since 0.1.0
 */

export { Bytes } from "./Bytes.js";
export { Hex } from "./Hex.js";
export { type RuntimeCodeType } from "./RuntimeCodeSchema.js";
