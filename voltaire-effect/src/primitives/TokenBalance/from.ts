import { TokenBalance } from '@tevm/voltaire'
type TokenBalanceType = TokenBalance.TokenBalanceType
import * as Effect from 'effect/Effect'

type TokenBalanceLike = bigint | number | string

export const from = (value: TokenBalanceLike): Effect.Effect<TokenBalanceType, Error> =>
  Effect.try({
    try: () => TokenBalance.from(value),
    catch: (e) => e as Error
  })

export const fromNumber = (value: number): Effect.Effect<TokenBalanceType, Error> =>
  Effect.try({
    try: () => TokenBalance.from(value),
    catch: (e) => e as Error
  })

export const fromBigInt = (value: bigint): Effect.Effect<TokenBalanceType, Error> =>
  Effect.try({
    try: () => TokenBalance.from(value),
    catch: (e) => e as Error
  })

export const fromHex = (value: string): Effect.Effect<TokenBalanceType, Error> =>
  Effect.try({
    try: () => TokenBalance.from(value),
    catch: (e) => e as Error
  })

export const fromBaseUnit = (value: string, decimals: number): Effect.Effect<TokenBalanceType, Error> =>
  Effect.try({
    try: () => TokenBalance.fromBaseUnit(value, decimals),
    catch: (e) => e as Error
  })

export const format = (balance: TokenBalanceType, decimals: number): Effect.Effect<string, never> =>
  Effect.succeed(TokenBalance.format(balance, decimals))

export const toBaseUnit = (balance: TokenBalanceType): Effect.Effect<bigint, never> =>
  Effect.succeed(TokenBalance.toBaseUnit(balance))
