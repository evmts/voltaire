/**
 * @module InitCode
 * @description Effect Schemas for contract initialization bytecode.
 *
 * Init code is the bytecode used during contract deployment, containing
 * constructor logic and the runtime bytecode to be stored on-chain.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `InitCode.Hex` | hex string | InitCodeType |
 * | `InitCode.Bytes` | Uint8Array | InitCodeType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as InitCode from 'voltaire-effect/primitives/InitCode'
 * import * as S from 'effect/Schema'
 *
 * // From hex string
 * const code = S.decodeSync(InitCode.Hex)('0x608060405234801561001057600080fd5b50')
 *
 * // From bytes
 * const code2 = S.decodeSync(InitCode.Bytes)(bytes)
 *
 * // Encode back to hex
 * const hex = S.encodeSync(InitCode.Hex)(code)
 * ```
 *
 * @since 0.1.0
 */

export type { InitCodeType } from "@tevm/voltaire/InitCode";
export { Bytes } from "./Bytes.js";
export { Hex } from "./Hex.js";
