import { ErrorSignature } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { ErrorSignatureType, ErrorSignatureLike } from './ErrorSignatureSchema.js'

/**
 * Error thrown when error signature operations fail.
 * @since 0.0.1
 */
export class ErrorSignatureError extends Error {
  readonly _tag = 'ErrorSignatureError'
  constructor(message: string) {
    super(message)
    this.name = 'ErrorSignatureError'
  }
}

/**
 * Creates an ErrorSignature from various input types.
 *
 * @param value - Hex string, bytes, or error signature string
 * @returns Effect yielding ErrorSignatureType or failing with ErrorSignatureError
 * @example
 * ```typescript
 * import * as ErrorSignature from 'voltaire-effect/ErrorSignature'
 * import { Effect } from 'effect'
 *
 * const program = ErrorSignature.from('0x08c379a0') // Error(string)
 * const sig = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = (value: ErrorSignatureLike): Effect.Effect<ErrorSignatureType, ErrorSignatureError> =>
  Effect.try({
    try: () => ErrorSignature.from(value),
    catch: (e) => new ErrorSignatureError((e as Error).message)
  })

/**
 * Creates an ErrorSignature from hex string.
 *
 * @param hex - 4-byte hex string with 0x prefix
 * @returns Effect yielding ErrorSignatureType
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<ErrorSignatureType, ErrorSignatureError> =>
  Effect.try({
    try: () => ErrorSignature.fromHex(hex),
    catch: (e) => new ErrorSignatureError((e as Error).message)
  })

/**
 * Creates an ErrorSignature from error signature string.
 *
 * @param signature - Error signature (e.g., "Error(string)")
 * @returns Effect yielding ErrorSignatureType (first 4 bytes of keccak256)
 * @since 0.0.1
 */
export const fromSignature = (signature: string): Effect.Effect<ErrorSignatureType, ErrorSignatureError> =>
  Effect.try({
    try: () => ErrorSignature.fromSignature(signature),
    catch: (e) => new ErrorSignatureError((e as Error).message)
  })

/**
 * Converts an ErrorSignature to hex string.
 *
 * @param sig - The error signature
 * @returns Effect yielding hex string
 * @since 0.0.1
 */
export const toHex = (sig: ErrorSignatureType): Effect.Effect<string, never> =>
  Effect.succeed(ErrorSignature.toHex(sig))

/**
 * Compares two error signatures for equality.
 *
 * @param a - First error signature
 * @param b - Second error signature
 * @returns Effect yielding true if equal
 * @since 0.0.1
 */
export const equals = (a: ErrorSignatureType, b: ErrorSignatureType): Effect.Effect<boolean, never> =>
  Effect.succeed(ErrorSignature.equals(a, b))
