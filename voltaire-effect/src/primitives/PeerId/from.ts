import { PeerId } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * Type representing a peer identifier.
 * @since 0.0.1
 */
type PeerIdType = ReturnType<typeof PeerId.from>

/**
 * Error thrown when PeerId creation fails.
 *
 * @example
 * ```typescript
 * import { PeerIdError } from 'voltaire-effect/primitives/PeerId'
 *
 * const error = new PeerIdError('Invalid peer ID format')
 * console.log(error._tag) // 'PeerIdError'
 * ```
 *
 * @since 0.0.1
 */
export class PeerIdError extends Error {
  /** Discriminant tag for error identification */
  readonly _tag = 'PeerIdError'
  /**
   * Creates a new PeerIdError.
   * @param message - Error description
   * @param cause - Optional underlying cause
   */
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'PeerIdError'
  }
}

/**
 * Creates a PeerId from a string using Effect for error handling.
 *
 * @param value - Peer ID string (typically base58 or multibase encoded)
 * @returns Effect that succeeds with the PeerId or fails with PeerIdError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from 'voltaire-effect/primitives/PeerId'
 *
 * const peerId = from('QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8...')
 * Effect.runSync(peerId)
 * ```
 *
 * @since 0.0.1
 */
export function from(value: string): Effect.Effect<PeerIdType, PeerIdError> {
  return Effect.try({
    try: () => PeerId.from(value),
    catch: (e) => new PeerIdError((e as Error).message, e)
  })
}
