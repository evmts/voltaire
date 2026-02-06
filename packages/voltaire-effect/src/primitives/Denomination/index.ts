/**
 * @fileoverview Denomination module for working with Ethereum value denominations.
 * Provides Effect-based operations for converting between Wei, Gwei, and Ether.
 *
 * @description
 * This module provides comprehensive support for Ethereum's three main denominations:
 * - **Wei**: The smallest unit (10^-18 ETH), used for precise calculations
 * - **Gwei**: Common for gas prices (10^9 Wei), used in fee estimation
 * - **Ether**: The primary unit (10^18 Wei), used in wallets and UIs
 *
 * All values are represented as branded bigints for type safety, preventing
 * accidental mixing of different denominations.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Denomination from 'voltaire-effect/primitives/Denomination'
 *
 * function displayEther(value: Denomination.EtherType) {
 *   // ...
 * }
 * ```
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/primitives/Denomination'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create values in different denominations
 *   const eth = yield* Denomination.fromEther(1n)
 *   const gwei = yield* Denomination.fromGwei(30n)
 *
 *   // Convert between denominations
 *   const weiFromEth = yield* Denomination.etherToWei(eth)
 *   const weiFromGwei = yield* Denomination.gweiToWei(gwei)
 *
 *   return { weiFromEth, weiFromGwei }
 * })
 * ```
 *
 * @module Denomination
 * @since 0.0.1
 * @see {@link WeiSchema} for Wei validation
 * @see {@link GweiSchema} for Gwei validation
 * @see {@link EtherSchema} for Ether validation
 */

export { EtherSchema, type EtherType } from "./EtherSchema.js";
