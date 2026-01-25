import { Address } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { EntryPointType } from './EntryPointSchema.js'

/**
 * Error thrown when EntryPoint operations fail.
 * @since 0.0.1
 */
export class EntryPointError extends Error {
  readonly _tag = 'EntryPointError'
  constructor(message: string) {
    super(message)
    this.name = 'EntryPointError'
  }
}

/**
 * Creates an EntryPoint from address string or bytes.
 *
 * @param value - Address as hex string or 20-byte Uint8Array
 * @returns Effect yielding EntryPointType or failing with EntryPointError
 * @example
 * ```typescript
 * import * as EntryPoint from 'voltaire-effect/EntryPoint'
 * import { Effect } from 'effect'
 *
 * const program = EntryPoint.from(EntryPoint.ENTRYPOINT_V07)
 * const entryPoint = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = (value: string | Uint8Array): Effect.Effect<EntryPointType, EntryPointError> =>
  Effect.try({
    try: () => {
      if (typeof value === 'string') {
        return Address(value) as unknown as EntryPointType
      }
      if (value.length !== 20) {
        throw new Error('EntryPoint must be exactly 20 bytes')
      }
      return value as unknown as EntryPointType
    },
    catch: (e) => new EntryPointError((e as Error).message)
  })

/**
 * Converts an EntryPoint to hex string.
 *
 * @param entryPoint - The entry point address
 * @returns Effect yielding hex string
 * @since 0.0.1
 */
export const toHex = (entryPoint: EntryPointType): Effect.Effect<string, never> =>
  Effect.succeed(Address.toHex(entryPoint as any))

/**
 * Compares two EntryPoints for equality.
 *
 * @param a - First entry point
 * @param b - Second entry point
 * @returns Effect yielding true if equal
 * @since 0.0.1
 */
export const equals = (a: EntryPointType, b: EntryPointType): Effect.Effect<boolean, never> => {
  if (a.length !== b.length) return Effect.succeed(false)
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return Effect.succeed(false)
  }
  return Effect.succeed(true)
}

/**
 * ERC-4337 EntryPoint v0.6 address.
 * @since 0.0.1
 */
export const ENTRYPOINT_V06 = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'

/**
 * ERC-4337 EntryPoint v0.7 address.
 * @since 0.0.1
 */
export const ENTRYPOINT_V07 = '0x0000000071727De22E5E9d8BAf0edAc6f37da032'
