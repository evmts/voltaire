/**
 * @fileoverview Effect-wrapped functions for creating and converting between denominations.
 * Provides safe constructors and conversion utilities for Wei, Gwei, and Ether.
 * @module Denomination/from
 * @since 0.0.1
 */

import { Uint } from '@tevm/voltaire'
import type { WeiType } from './WeiSchema.js'
import type { GweiType } from './GweiSchema.js'
import type { EtherType } from './EtherSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when denomination conversion fails.
 *
 * @description
 * Indicates that a value could not be converted to a denomination type,
 * typically because the value is negative or cannot be parsed.
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/primitives/Denomination'
 * import * as Effect from 'effect/Effect'
 *
 * const result = Effect.runSyncExit(Denomination.fromWei(-1n))
 * // Exit.Failure with DenominationError
 * ```
 *
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
 * @description
 * Validates and creates a WeiType from numeric input. Wei is the smallest
 * unit of Ether and is used for all precise value calculations.
 *
 * @param value - Value to convert to Wei (bigint, number, or string)
 * @returns Effect yielding WeiType or failing with DenominationError
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/primitives/Denomination'
 * import * as Effect from 'effect/Effect'
 *
 * // Create 1 ETH in Wei
 * const wei = Effect.runSync(Denomination.fromWei(1000000000000000000n))
 *
 * // From string
 * const fromStr = Effect.runSync(Denomination.fromWei('1000000'))
 * ```
 *
 * @throws DenominationError - When the value is negative or cannot be converted
 * @see {@link WeiSchema} for schema-based validation
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
 * @description
 * Validates and creates a GweiType from numeric input. Gwei is commonly
 * used for expressing gas prices in Ethereum.
 *
 * @param value - Value to convert to Gwei (bigint, number, or string)
 * @returns Effect yielding GweiType or failing with DenominationError
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/primitives/Denomination'
 * import * as Effect from 'effect/Effect'
 *
 * // Create a gas price of 30 Gwei
 * const gwei = Effect.runSync(Denomination.fromGwei(30n))
 * ```
 *
 * @throws DenominationError - When the value is negative or cannot be converted
 * @see {@link GweiSchema} for schema-based validation
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
 * @description
 * Validates and creates an EtherType from numeric input. Ether is the
 * primary unit used in wallets and user interfaces.
 *
 * @param value - Value to convert to Ether (bigint, number, or string)
 * @returns Effect yielding EtherType or failing with DenominationError
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/primitives/Denomination'
 * import * as Effect from 'effect/Effect'
 *
 * // Create 10 ETH
 * const eth = Effect.runSync(Denomination.fromEther(10n))
 * ```
 *
 * @throws DenominationError - When the value is negative or cannot be converted
 * @see {@link EtherSchema} for schema-based validation
 * @since 0.0.1
 */
export const fromEther = (value: bigint | number | string): Effect.Effect<EtherType, DenominationError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as EtherType,
    catch: (e) => new DenominationError((e as Error).message)
  })

/** Conversion constant: Wei per Gwei (10^9) @internal */
const WEI_PER_GWEI = 1_000_000_000n
/** Conversion constant: Wei per Ether (10^18) @internal */
const WEI_PER_ETHER = 1_000_000_000_000_000_000n
/** Conversion constant: Gwei per Ether (10^9) @internal */
const GWEI_PER_ETHER = 1_000_000_000n

/**
 * Converts Wei to Gwei.
 *
 * @description
 * Divides Wei by 10^9 to get Gwei. Note that integer division truncates
 * any fractional Gwei.
 *
 * @param wei - Wei value to convert
 * @returns Effect yielding GweiType (never fails)
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/primitives/Denomination'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const wei = yield* Denomination.fromWei(30000000000n)
 *   const gwei = yield* Denomination.weiToGwei(wei)
 *   return gwei // 30n
 * })
 * ```
 *
 * @see {@link gweiToWei} for the reverse operation
 * @since 0.0.1
 */
export const weiToGwei = (wei: WeiType): Effect.Effect<GweiType, never> =>
  Effect.succeed((wei / WEI_PER_GWEI) as unknown as GweiType)

/**
 * Converts Wei to Ether.
 *
 * @description
 * Divides Wei by 10^18 to get Ether. Note that integer division truncates
 * any fractional Ether.
 *
 * @param wei - Wei value to convert
 * @returns Effect yielding EtherType (never fails)
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/primitives/Denomination'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const wei = yield* Denomination.fromWei(2000000000000000000n)
 *   const eth = yield* Denomination.weiToEther(wei)
 *   return eth // 2n
 * })
 * ```
 *
 * @see {@link etherToWei} for the reverse operation
 * @since 0.0.1
 */
export const weiToEther = (wei: WeiType): Effect.Effect<EtherType, never> =>
  Effect.succeed((wei / WEI_PER_ETHER) as unknown as EtherType)

/**
 * Converts Gwei to Wei.
 *
 * @description
 * Multiplies Gwei by 10^9 to get Wei. This is a lossless conversion.
 *
 * @param gwei - Gwei value to convert
 * @returns Effect yielding WeiType (never fails)
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/primitives/Denomination'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const gwei = yield* Denomination.fromGwei(30n)
 *   const wei = yield* Denomination.gweiToWei(gwei)
 *   return wei // 30000000000n
 * })
 * ```
 *
 * @see {@link weiToGwei} for the reverse operation
 * @since 0.0.1
 */
export const gweiToWei = (gwei: GweiType): Effect.Effect<WeiType, never> =>
  Effect.succeed((gwei * WEI_PER_GWEI) as unknown as WeiType)

/**
 * Converts Gwei to Ether.
 *
 * @description
 * Divides Gwei by 10^9 to get Ether. Note that integer division truncates
 * any fractional Ether.
 *
 * @param gwei - Gwei value to convert
 * @returns Effect yielding EtherType (never fails)
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/primitives/Denomination'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const gwei = yield* Denomination.fromGwei(2000000000n)
 *   const eth = yield* Denomination.gweiToEther(gwei)
 *   return eth // 2n
 * })
 * ```
 *
 * @see {@link etherToGwei} for the reverse operation
 * @since 0.0.1
 */
export const gweiToEther = (gwei: GweiType): Effect.Effect<EtherType, never> =>
  Effect.succeed((gwei / GWEI_PER_ETHER) as unknown as EtherType)

/**
 * Converts Ether to Wei.
 *
 * @description
 * Multiplies Ether by 10^18 to get Wei. This is a lossless conversion.
 *
 * @param ether - Ether value to convert
 * @returns Effect yielding WeiType (never fails)
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/primitives/Denomination'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const eth = yield* Denomination.fromEther(1n)
 *   const wei = yield* Denomination.etherToWei(eth)
 *   return wei // 1000000000000000000n
 * })
 * ```
 *
 * @see {@link weiToEther} for the reverse operation
 * @since 0.0.1
 */
export const etherToWei = (ether: EtherType): Effect.Effect<WeiType, never> =>
  Effect.succeed((ether * WEI_PER_ETHER) as unknown as WeiType)

/**
 * Converts Ether to Gwei.
 *
 * @description
 * Multiplies Ether by 10^9 to get Gwei. This is a lossless conversion.
 *
 * @param ether - Ether value to convert
 * @returns Effect yielding GweiType (never fails)
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/primitives/Denomination'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const eth = yield* Denomination.fromEther(1n)
 *   const gwei = yield* Denomination.etherToGwei(eth)
 *   return gwei // 1000000000n
 * })
 * ```
 *
 * @see {@link gweiToEther} for the reverse operation
 * @since 0.0.1
 */
export const etherToGwei = (ether: EtherType): Effect.Effect<GweiType, never> =>
  Effect.succeed((ether * GWEI_PER_ETHER) as unknown as GweiType)
