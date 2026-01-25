/**
 * Bytecode module for EVM contract bytecode.
 * Provides Effect-based schemas and functions for bytecode handling.
 * 
 * @example
 * ```typescript
 * import * as Bytecode from 'voltaire-effect/primitives/Bytecode'
 * import * as Effect from 'effect/Effect'
 * 
 * const code = await Effect.runPromise(Bytecode.from('0x6080...'))
 * ```
 * 
 * @since 0.0.1
 * @module
 */

export { Schema, type BytecodeType } from './BytecodeSchema.js'
export { from } from './from.js'
