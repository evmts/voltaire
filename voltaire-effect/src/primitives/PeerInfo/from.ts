import { PeerInfo } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * Type representing peer information.
 * @since 0.0.1
 */
type PeerInfoType = ReturnType<typeof PeerInfo.from>

/**
 * Error thrown when PeerInfo creation fails.
 *
 * @example
 * ```typescript
 * import { PeerInfoError } from 'voltaire-effect/primitives/PeerInfo'
 *
 * const error = new PeerInfoError('Missing required peer fields')
 * console.log(error._tag) // 'PeerInfoError'
 * ```
 *
 * @since 0.0.1
 */
export class PeerInfoError extends Error {
  /** Discriminant tag for error identification */
  readonly _tag = 'PeerInfoError'
  /**
   * Creates a new PeerInfoError.
   * @param message - Error description
   * @param cause - Optional underlying cause
   */
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'PeerInfoError'
  }
}

/**
 * Creates PeerInfo from raw peer data using Effect for error handling.
 *
 * @param value - Raw peer information object
 * @returns Effect that succeeds with PeerInfoType or fails with PeerInfoError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from 'voltaire-effect/primitives/PeerInfo'
 *
 * const peerInfo = from({
 *   id: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8...',
 *   name: 'Geth/v1.10.0',
 *   caps: ['eth/66'],
 *   network: {},
 *   protocols: {}
 * })
 *
 * Effect.runSync(peerInfo)
 * ```
 *
 * @since 0.0.1
 */
export function from(value: unknown): Effect.Effect<PeerInfoType, PeerInfoError> {
  return Effect.try({
    try: () => PeerInfo.from(value),
    catch: (e) => new PeerInfoError((e as Error).message, e)
  })
}
