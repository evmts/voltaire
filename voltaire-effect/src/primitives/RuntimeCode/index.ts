/**
 * RuntimeCode module for Effect-based contract bytecode handling.
 *
 * Provides Effect-wrapped operations for working with deployed contract
 * runtime bytecode (code stored at contract addresses).
 *
 * @example
 * ```typescript
 * import * as RuntimeCode from 'voltaire-effect/primitives/RuntimeCode'
 * import * as Effect from 'effect/Effect'
 *
 * // From hex string
 * const code1 = RuntimeCode.fromHex('0x6080604052...')
 *
 * // From bytes
 * const code2 = RuntimeCode.from(bytecodeBytes)
 *
 * Effect.runSync(code1)
 * ```
 *
 * @module
 * @since 0.0.1
 */
export { Schema, type RuntimeCodeType } from './RuntimeCodeSchema.js'
export { from, fromHex, RuntimeCodeError } from './from.js'
