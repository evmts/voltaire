import { TypedData } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * TypedData validation error
 */
export class TypedDataError extends Error {
  readonly _tag = 'TypedDataError'
  constructor(
    message: string,
    readonly context?: { value?: unknown; expected?: string; cause?: Error }
  ) {
    super(message)
    this.name = 'TypedDataError'
  }
}

/**
 * TypedData input type
 */
export type TypedDataInput<T = Record<string, unknown>> = {
  types: {
    EIP712Domain: readonly { name: string; type: string }[]
    [key: string]: readonly { name: string; type: string }[]
  }
  primaryType: string
  domain: {
    name?: string
    version?: string
    chainId?: bigint | number
    verifyingContract?: Uint8Array | string
    salt?: Uint8Array | string
  }
  message: T
}

/**
 * Create TypedData from a raw object
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from './from.js'
 * 
 * const result = await Effect.runPromise(from({
 *   types: {
 *     EIP712Domain: [{ name: 'name', type: 'string' }],
 *     Person: [{ name: 'name', type: 'string' }]
 *   },
 *   primaryType: 'Person',
 *   domain: { name: 'My App' },
 *   message: { name: 'Bob' }
 * }))
 * ```
 */
export const from = <T = Record<string, unknown>>(typedData: TypedDataInput<T>): Effect.Effect<unknown, TypedDataError> =>
  Effect.try({
    try: () => TypedData.from(typedData as Parameters<typeof TypedData.from>[0]),
    catch: (e) => new TypedDataError(
      e instanceof Error ? e.message : String(e),
      { value: typedData, expected: 'valid EIP-712 typed data', cause: e instanceof Error ? e : undefined }
    )
  })
