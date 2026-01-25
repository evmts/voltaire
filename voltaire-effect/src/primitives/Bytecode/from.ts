import { Bytecode } from '@tevm/voltaire/Bytecode'
import * as Effect from 'effect/Effect'
import type { BytecodeType } from './BytecodeSchema.js'

/**
 * Creates Bytecode from hex string or bytes.
 * Never throws - returns Effect with error in channel.
 * 
 * @param value - Hex string or Uint8Array of bytecode
 * @returns Effect yielding BytecodeType or failing with Error
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Bytecode from 'voltaire-effect/primitives/Bytecode'
 * 
 * const code = await Effect.runPromise(Bytecode.from('0x6080...'))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (value: Uint8Array | string): Effect.Effect<BytecodeType, Error> =>
  Effect.try({
    try: () => Bytecode.from(value),
    catch: (e) => e as Error
  })
