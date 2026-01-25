/**
 * @module Bytecode
 * @description Effect Schemas for EVM contract bytecode.
 *
 * Bytecode is the compiled machine code executed by the EVM.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Bytecode from 'voltaire-effect/primitives/Bytecode'
 *
 * function deployContract(code: Bytecode.BytecodeType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Bytecode.Hex` | hex string | BytecodeType |
 * | `Bytecode.Bytes` | Uint8Array | BytecodeType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Bytecode from 'voltaire-effect/primitives/Bytecode'
 * import * as S from 'effect/Schema'
 *
 * // From hex string
 * const code = S.decodeSync(Bytecode.Hex)('0x6080604052...')
 *
 * // From bytes
 * const code2 = S.decodeSync(Bytecode.Bytes)(bytes)
 *
 * // Encode back to hex
 * const hex = S.encodeSync(Bytecode.Hex)(code)
 * ```
 *
 * @since 0.1.0
 */

export { Bytes } from "./Bytes.js";
export { type BytecodeType } from "./BytecodeSchema.js";
export { Hex } from "./Hex.js";
