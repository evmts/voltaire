import { Uncle } from '@tevm/voltaire'
import type { UncleType } from './UncleSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when uncle creation fails.
 * @since 0.0.1
 */
export class UncleError {
  /** Discriminant tag for error identification */
  readonly _tag = 'UncleError'
  constructor(readonly message: string) {}
}

type UncleInput = Parameters<typeof Uncle.from>[0]

/**
 * Creates a validated Uncle from block header data.
 * 
 * @param params - Uncle block header parameters
 * @returns Effect containing the validated Uncle or UncleError
 * 
 * @since 0.0.1
 */
export const from = (params: UncleInput): Effect.Effect<UncleType, UncleError> =>
  Effect.try({
    try: () => Uncle.from(params),
    catch: (e) => new UncleError((e as Error).message)
  })
