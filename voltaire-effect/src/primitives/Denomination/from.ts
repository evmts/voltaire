import { Uint } from '@tevm/voltaire'
import type { WeiType } from './WeiSchema.js'
import type { GweiType } from './GweiSchema.js'
import type { EtherType } from './EtherSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when denomination conversion fails.
 * @since 0.0.1
 */
export class DenominationError extends Error {
  readonly _tag = 'DenominationError'
  constructor(message: string) {
    super(message)
    this.name = 'DenominationError'
  }
}

/**
 * Creates a Wei value from numeric input.
 *
 * @param value - Value to convert to Wei
 * @returns Effect yielding WeiType or failing with DenominationError
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/Denomination'
 * import { Effect } from 'effect'
 *
 * const wei = Effect.runSync(Denomination.fromWei(1000000000000000000n))
 * ```
 * @since 0.0.1
 */
export const fromWei = (value: bigint | number | string): Effect.Effect<WeiType, DenominationError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as WeiType,
    catch: (e) => new DenominationError((e as Error).message)
  })

/**
 * Creates a Gwei value from numeric input.
 *
 * @param value - Value to convert to Gwei
 * @returns Effect yielding GweiType or failing with DenominationError
 * @since 0.0.1
 */
export const fromGwei = (value: bigint | number | string): Effect.Effect<GweiType, DenominationError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as GweiType,
    catch: (e) => new DenominationError((e as Error).message)
  })

/**
 * Creates an Ether value from numeric input.
 *
 * @param value - Value to convert to Ether
 * @returns Effect yielding EtherType or failing with DenominationError
 * @since 0.0.1
 */
export const fromEther = (value: bigint | number | string): Effect.Effect<EtherType, DenominationError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as EtherType,
    catch: (e) => new DenominationError((e as Error).message)
  })

const WEI_PER_GWEI = 1_000_000_000n
const WEI_PER_ETHER = 1_000_000_000_000_000_000n
const GWEI_PER_ETHER = 1_000_000_000n

/**
 * Converts Wei to Gwei.
 *
 * @param wei - Wei value to convert
 * @returns Effect yielding GweiType
 * @since 0.0.1
 */
export const weiToGwei = (wei: WeiType): Effect.Effect<GweiType, never> =>
  Effect.succeed((wei / WEI_PER_GWEI) as unknown as GweiType)

/**
 * Converts Wei to Ether.
 *
 * @param wei - Wei value to convert
 * @returns Effect yielding EtherType
 * @since 0.0.1
 */
export const weiToEther = (wei: WeiType): Effect.Effect<EtherType, never> =>
  Effect.succeed((wei / WEI_PER_ETHER) as unknown as EtherType)

/**
 * Converts Gwei to Wei.
 *
 * @param gwei - Gwei value to convert
 * @returns Effect yielding WeiType
 * @since 0.0.1
 */
export const gweiToWei = (gwei: GweiType): Effect.Effect<WeiType, never> =>
  Effect.succeed((gwei * WEI_PER_GWEI) as unknown as WeiType)

/**
 * Converts Gwei to Ether.
 *
 * @param gwei - Gwei value to convert
 * @returns Effect yielding EtherType
 * @since 0.0.1
 */
export const gweiToEther = (gwei: GweiType): Effect.Effect<EtherType, never> =>
  Effect.succeed((gwei / GWEI_PER_ETHER) as unknown as EtherType)

/**
 * Converts Ether to Wei.
 *
 * @param ether - Ether value to convert
 * @returns Effect yielding WeiType
 * @since 0.0.1
 */
export const etherToWei = (ether: EtherType): Effect.Effect<WeiType, never> =>
  Effect.succeed((ether * WEI_PER_ETHER) as unknown as WeiType)

/**
 * Converts Ether to Gwei.
 *
 * @param ether - Ether value to convert
 * @returns Effect yielding GweiType
 * @since 0.0.1
 */
export const etherToGwei = (ether: EtherType): Effect.Effect<GweiType, never> =>
  Effect.succeed((ether * GWEI_PER_ETHER) as unknown as GweiType)
