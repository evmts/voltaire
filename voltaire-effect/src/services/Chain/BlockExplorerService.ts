/**
 * @fileoverview Block explorer service definition for chain explorer metadata.
 *
 * @module BlockExplorerService
 * @since 0.0.1
 *
 * @description
 * The BlockExplorerService provides block explorer metadata for a chain,
 * including human-readable name, base URL, and optional API URL.
 */

import * as Context from "effect/Context";

/**
 * Block explorer configuration for a chain.
 *
 * @since 0.0.1
 */
export interface BlockExplorerConfig {
	/** Default block explorer for the chain */
	readonly default?: {
		readonly name: string;
		readonly url: string;
		readonly apiUrl?: string;
	};
}

/**
 * Block explorer service for chain metadata.
 *
 * @description
 * Provides access to block explorer information for the active chain.
 *
 * @since 0.0.1
 */
export class BlockExplorerService extends Context.Tag("BlockExplorerService")<
	BlockExplorerService,
	BlockExplorerConfig
>() {}
