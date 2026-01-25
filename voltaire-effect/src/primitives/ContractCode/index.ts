/**
 * @module ContractCode
 * @description Effect Schemas for smart contract bytecode.
 *
 * Contract code is compiled bytecode ready for deployment or execution.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as ContractCode from 'voltaire-effect/primitives/ContractCode'
 *
 * function executeContract(code: ContractCode.ContractCodeType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `ContractCode.Hex` | hex string | ContractCodeType |
 * | `ContractCode.Bytes` | Uint8Array | ContractCodeType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as ContractCode from 'voltaire-effect/primitives/ContractCode'
 * import * as S from 'effect/Schema'
 *
 * // From hex string
 * const code = S.decodeSync(ContractCode.Hex)('0x608060405234801561001057600080fd5b50...')
 *
 * // From bytes
 * const code2 = S.decodeSync(ContractCode.Bytes)(bytes)
 *
 * // Encode back to hex
 * const hex = S.encodeSync(ContractCode.Hex)(code)
 * ```
 *
 * @since 0.1.0
 */

export { Bytes } from "./Bytes.js";
export type { ContractCodeType } from "@tevm/voltaire/ContractCode";
export { Hex } from "./Hex.js";
