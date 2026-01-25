import { MultiTokenId } from '@tevm/voltaire'
type MultiTokenIdType = MultiTokenId.MultiTokenIdType
import * as Effect from 'effect/Effect'

type MultiTokenIdLike = bigint | number | string

export const from = (value: MultiTokenIdLike): Effect.Effect<MultiTokenIdType, Error> =>
  Effect.try({
    try: () => MultiTokenId.from(value),
    catch: (e) => e as Error
  })

export const fromNumber = (value: number): Effect.Effect<MultiTokenIdType, Error> =>
  Effect.try({
    try: () => MultiTokenId.from(value),
    catch: (e) => e as Error
  })

export const fromBigInt = (value: bigint): Effect.Effect<MultiTokenIdType, Error> =>
  Effect.try({
    try: () => MultiTokenId.from(value),
    catch: (e) => e as Error
  })

export const fromHex = (value: string): Effect.Effect<MultiTokenIdType, Error> =>
  Effect.try({
    try: () => MultiTokenId.from(value),
    catch: (e) => e as Error
  })

export const isValidFungible = (tokenId: MultiTokenIdType): Effect.Effect<boolean, never> =>
  Effect.succeed(MultiTokenId.isValidFungible(tokenId))

export const isValidNonFungible = (tokenId: MultiTokenIdType): Effect.Effect<boolean, never> =>
  Effect.succeed(MultiTokenId.isValidNonFungible(tokenId))
