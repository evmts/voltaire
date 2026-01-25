/**
 * Opcode module for Effect-based EVM opcode handling.
 *
 * Provides Effect-wrapped operations for working with EVM opcodes (0x00-0xFF).
 *
 * @example
 * ```typescript
 * import * as Opcode from 'voltaire-effect/primitives/Opcode'
 * import * as Effect from 'effect/Effect'
 *
 * // Create opcode from number
 * const add = Opcode.from(0x01) // ADD
 * const stop = Opcode.from(0x00) // STOP
 *
 * // Use with schema validation
 * import * as S from 'effect/Schema'
 * const validated = S.decodeSync(Opcode.OpcodeSchema)(0x60) // PUSH1
 * ```
 *
 * @module
 * @since 0.0.1
 */
export { OpcodeSchema } from './OpcodeSchema.js'
export { from, OpcodeError } from './from.js'
