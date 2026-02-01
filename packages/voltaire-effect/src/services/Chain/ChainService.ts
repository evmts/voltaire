/**
 * @fileoverview Chain service definition for blockchain network configuration.
 *
 * @module ChainService
 * @since 0.0.1
 *
 * @description
 * The ChainService provides core chain configuration data including network ID,
 * native currency, block time, and testnet status.
 *
 * Use one of the predefined chain layers (mainnet, sepolia, etc.) or create
 * a custom chain configuration using Layer.succeed.
 *
 * @see {@link ./chains/mainnet} - Ethereum mainnet configuration
 * @see {@link ./chains/sepolia} - Sepolia testnet configuration
 */

import * as Context from "effect/Context";

/**
 * Chain configuration data structure.
 *
 * @description
 * Contains core metadata needed to identify and describe a blockchain network.
 * Aligns with viem's base chain fields for compatibility.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const config: ChainConfig = {
 *   id: 1,
 *   name: 'Ethereum',
 *   nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
 *   blockTime: 12000
 * }
 * ```
 */
export interface ChainConfig {
	/** Chain ID (e.g., 1 for mainnet, 11155111 for sepolia) */
	readonly id: number;
	/** Human-readable chain name */
	readonly name: string;
	/** Native currency configuration */
	readonly nativeCurrency: {
		readonly name: string;
		readonly symbol: string;
		readonly decimals: number;
	};
	/** Average block time in milliseconds */
	readonly blockTime: number;
	/** Whether this is a testnet */
	readonly testnet?: boolean;
}

/**
 * Chain service for blockchain network configuration.
 *
 * @description
 * Provides chain-specific configuration including network ID, native currency,
 * block time, and testnet flag.
 *
 * Use predefined chain layers or create custom ones:
 *
 * @since 0.0.1
 *
 * @example Using a predefined chain
 * ```typescript
 * import { Effect } from 'effect'
 * import { ChainService, mainnet } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const chain = yield* ChainService
 *   console.log(`Connected to ${chain.name} (${chain.id})`)
 *   return chain
 * }).pipe(Effect.provide(mainnet))
 * ```
 *
 * @example Creating a custom chain
 * ```typescript
 * import { Layer } from 'effect'
 * import { ChainService, ChainConfig } from 'voltaire-effect'
 *
 * const myChain = Layer.succeed(ChainService, {
 *   id: 12345,
 *   name: 'My Chain',
 *   nativeCurrency: { name: 'Token', symbol: 'TKN', decimals: 18 },
 *   blockTime: 2000
 * } satisfies ChainConfig)
 * ```
 *
 * @see {@link ChainConfig} - The configuration interface
 */
export class ChainService extends Context.Tag("ChainService")<
	ChainService,
	ChainConfig
>() {}
