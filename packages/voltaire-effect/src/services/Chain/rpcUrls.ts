/**
 * @fileoverview RPC URL map for built-in chains.
 *
 * @module rpcUrls
 * @since 0.0.1
 */

/**
 * RPC endpoint configuration for a chain.
 *
 * @since 0.0.1
 */
export interface RpcUrlsConfig {
	readonly default: {
		readonly http: readonly string[];
	};
}

/**
 * RPC URLs keyed by chain ID.
 *
 * @since 0.0.1
 */
export const rpcUrlsByChainId: Readonly<Record<number, RpcUrlsConfig>> = {
	1: { default: { http: ["https://eth.merkle.io"] } },
	10: { default: { http: ["https://mainnet.optimism.io"] } },
	137: { default: { http: ["https://polygon-rpc.com"] } },
	8453: { default: { http: ["https://mainnet.base.org"] } },
	42161: { default: { http: ["https://arb1.arbitrum.io/rpc"] } },
	11155111: { default: { http: ["https://11155111.rpc.thirdweb.com"] } },
} as const;
