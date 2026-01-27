/**
 * @fileoverview Contracts service definition for well-known deployments.
 *
 * @module ContractsService
 * @since 0.0.1
 *
 * @description
 * The ContractsService provides well-known contract deployments for a chain,
 * such as multicall and ENS resolver addresses.
 */

import * as Context from "effect/Context";

/**
 * Contract deployment information.
 *
 * @since 0.0.1
 */
export interface ChainContract {
	readonly address: `0x${string}`;
	readonly blockCreated?: number;
}

/**
 * Well-known contract deployments for a chain.
 *
 * @since 0.0.1
 */
export interface ContractsConfig {
	readonly multicall3?: ChainContract;
	readonly ensRegistry?: ChainContract;
	readonly ensUniversalResolver?: ChainContract;
}

/**
 * Contracts service for chain deployment metadata.
 *
 * @description
 * Provides access to well-known contract deployments for the active chain.
 *
 * @since 0.0.1
 */
export class ContractsService extends Context.Tag("ContractsService")<
	ContractsService,
	ContractsConfig
>() {}
