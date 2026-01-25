import { Opcode } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * Type representing an EVM opcode value (0x00-0xFF).
 * @since 0.0.1
 */
type OpcodeType = ReturnType<typeof Opcode>

/**
 * Error thrown when opcode creation fails.
 *
 * @example
 * ```typescript
 * import { OpcodeError } from 'voltaire-effect/primitives/Opcode'
 *
 * const error = new OpcodeError('Opcode must be between 0x00 and 0xFF')
 * console.log(error._tag) // 'OpcodeError'
 * ```
 *
 * @since 0.0.1
 */
export class OpcodeError extends Error {
  /** Discriminant tag for error identification */
  readonly _tag = 'OpcodeError'
  /**
   * Creates a new OpcodeError.
   * @param message - Error description
   * @param cause - Optional underlying cause
   */
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'OpcodeError'
  }
}

/**
 * Creates an Opcode from a numeric value using Effect for error handling.
 *
 * @param value - Numeric opcode value (must be 0x00-0xFF)
 * @returns Effect that succeeds with the Opcode or fails with OpcodeError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from 'voltaire-effect/primitives/Opcode'
 *
 * // Create ADD opcode
 * const program = from(0x01)
 * const result = Effect.runSync(program) // Opcode(0x01)
 *
 * // Handle invalid opcode
 * const invalid = from(0x100)
 * // Effect fails with OpcodeError
 * ```
 *
 * @since 0.0.1
 */
export function from(value: number): Effect.Effect<OpcodeType, OpcodeError> {
  return Effect.try({
    try: () => {
      if (value < 0x00 || value > 0xff) {
        throw new Error(`Opcode must be between 0x00 and 0xFF, got ${value}`)
      }
      return Opcode(value)
    },
    catch: (e) => new OpcodeError((e as Error).message, e)
  })
}
