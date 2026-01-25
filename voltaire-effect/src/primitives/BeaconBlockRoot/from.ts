import { BeaconBlockRoot } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type BeaconBlockRootType = BeaconBlockRoot.BeaconBlockRootType

/**
 * Creates a BeaconBlockRoot from hex string or bytes.
 * Never throws - returns Effect with error in channel.
 * 
 * @param value - 32-byte hex string or Uint8Array
 * @returns Effect yielding BeaconBlockRootType or failing with Error
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BeaconBlockRoot from 'voltaire-effect/primitives/BeaconBlockRoot'
 * 
 * const root = await Effect.runPromise(BeaconBlockRoot.from('0x...'))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (value: string | Uint8Array): Effect.Effect<BeaconBlockRootType, Error> =>
  Effect.try({
    try: () => BeaconBlockRoot.from(value),
    catch: (e) => e as Error
  })
