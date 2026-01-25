import { TokenId } from '@tevm/voltaire'
type TokenIdType = TokenId.TokenIdType
import * as Effect from 'effect/Effect'

type TokenIdLike = bigint | number | string

export const from = (value: TokenIdLike): Effect.Effect<TokenIdType, Error> =>
  Effect.try({
    try: () => TokenId.from(value),
    catch: (e) => e as Error
  })

export const fromNumber = (value: number): Effect.Effect<TokenIdType, Error> =>
  Effect.try({
    try: () => TokenId.from(value),
    catch: (e) => e as Error
  })

export const fromBigInt = (value: bigint): Effect.Effect<TokenIdType, Error> =>
  Effect.try({
    try: () => TokenId.from(value),
    catch: (e) => e as Error
  })

export const fromHex = (value: string): Effect.Effect<TokenIdType, Error> =>
  Effect.try({
    try: () => TokenId.from(value),
    catch: (e) => e as Error
  })
