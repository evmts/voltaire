import { FunctionSignature } from '@tevm/voltaire'
import type { FunctionSignatureType } from './FunctionSignatureSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when function signature parsing fails.
 * @since 0.0.1
 */
export class FunctionSignatureError {
  readonly _tag = 'FunctionSignatureError'
  constructor(readonly message: string) {}
}

/**
 * Parses a function signature string into its components.
 * @param value - Function signature like "transfer(address,uint256)"
 * @returns Effect containing FunctionSignatureType or FunctionSignatureError
 * @example
 * ```ts
 * import * as FunctionSignature from 'voltaire-effect/primitives/FunctionSignature'
 *
 * const sig = FunctionSignature.from('transfer(address,uint256)')
 * ```
 * @since 0.0.1
 */
export const from = (value: string): Effect.Effect<FunctionSignatureType, FunctionSignatureError> =>
  Effect.try({
    try: () => FunctionSignature.from(value),
    catch: (e) => new FunctionSignatureError((e as Error).message)
  })

/**
 * Creates a FunctionSignature from a signature string (alias for from).
 * @param signature - Function signature string
 * @returns Effect containing FunctionSignatureType or FunctionSignatureError
 * @example
 * ```ts
 * import * as FunctionSignature from 'voltaire-effect/primitives/FunctionSignature'
 *
 * const sig = FunctionSignature.fromSignature('balanceOf(address)')
 * ```
 * @since 0.0.1
 */
export const fromSignature = (signature: string): Effect.Effect<FunctionSignatureType, FunctionSignatureError> =>
  Effect.try({
    try: () => FunctionSignature.fromSignature(signature),
    catch: (e) => new FunctionSignatureError((e as Error).message)
  })
