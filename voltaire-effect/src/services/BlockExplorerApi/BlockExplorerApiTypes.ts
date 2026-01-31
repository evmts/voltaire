/**
 * @fileoverview Block Explorer API type definitions.
 *
 * @module BlockExplorerApiTypes
 * @since 0.0.1
 *
 * @description
 * Defines types for Block Explorer API configuration, responses, and errors.
 * Used by BlockExplorerApiService to resolve ABIs and contract metadata.
 */

import type { Redacted } from "effect";

/**
 * Identifier for supported block explorer sources.
 * @since 0.0.1
 */
export type ExplorerSourceId = "sourcify" | "etherscanV2" | "blockscout";

/**
 * Configuration for the Block Explorer API service.
 * @since 0.0.1
 */
export interface BlockExplorerApiConfig {
	readonly sources: {
		readonly sourcify?: {
			readonly enabled: boolean;
			/** Custom Sourcify instance URL */
			readonly baseUrl?: string;
		};
		readonly etherscanV2?: {
			readonly enabled: boolean;
			readonly apiKey?: Redacted.Redacted<string> | string;
			/** Custom Etherscan-compatible API URL */
			readonly baseUrl?: string;
		};
		readonly blockscout?: {
			readonly enabled: boolean;
			readonly apiKey?: Redacted.Redacted<string> | string;
			/** Custom Blockscout instance URL */
			readonly baseUrl?: string;
		};
	};

	/**
	 * Order for "verified-first" resolution.
	 * Defaults to ["sourcify", "etherscanV2", "blockscout"].
	 */
	readonly sourceOrder?: ReadonlyArray<ExplorerSourceId>;

	/**
	 * Default behavior for proxy following.
	 */
	readonly followProxiesByDefault?: boolean;

	/**
	 * Enable best-effort ABI recovery (ABR) when verified ABI is missing.
	 * Intended for inspection tooling.
	 */
	readonly enableBestEffortAbiRecovery?: boolean;

	/**
	 * Cache resolved ABIs.
	 */
	readonly cache?: {
		readonly enabled: boolean;
		readonly ttlMillis?: number;
		readonly capacity?: number;
	};
}

/**
 * Single item in an ABI definition.
 * Standard Solidity ABI format.
 * @since 0.0.1
 */
export type AbiItem = {
	readonly type: string;
	readonly name?: string;
	readonly inputs?: ReadonlyArray<{
		readonly name?: string;
		readonly type: string;
		readonly indexed?: boolean;
		readonly components?: ReadonlyArray<{ readonly name?: string; readonly type: string }>;
	}>;
	readonly outputs?: ReadonlyArray<{
		readonly name?: string;
		readonly type: string;
		readonly components?: ReadonlyArray<{ readonly name?: string; readonly type: string }>;
	}>;
	readonly stateMutability?: "pure" | "view" | "nonpayable" | "payable";
	readonly anonymous?: boolean;
};

/**
 * Source file from a verified contract.
 * @since 0.0.1
 */
export interface ContractSourceFile {
	readonly path: string;
	readonly content: string;
}

/**
 * How the ABI was resolved.
 * @since 0.0.1
 */
export type AbiResolution =
	| { readonly mode: "verified"; readonly source: ExplorerSourceId }
	| { readonly mode: "best-effort"; readonly source: "whatsabi" };

/**
 * Proxy chain entry for debugging/UX.
 * @since 0.0.1
 */
export interface ProxyInfo {
	readonly kind: string;
	readonly address: `0x${string}`;
}

/**
 * Result of resolving a contract from block explorers.
 * @since 0.0.1
 */
export interface ResolvedExplorerContract {
	/** Resolved address (implementation if proxies followed) */
	readonly address: `0x${string}`;
	/** Original input address */
	readonly requestedAddress: `0x${string}`;
	/** Contract name if available */
	readonly name?: string;
	/** Resolved ABI */
	readonly abi: ReadonlyArray<AbiItem>;
	/** How the ABI was resolved */
	readonly resolution: AbiResolution;
	/** Source files if requested and available */
	readonly sources?: ReadonlyArray<ContractSourceFile>;
	/** Proxy chain if followProxies was true */
	readonly proxies?: ReadonlyArray<ProxyInfo>;
}

/**
 * Options for getContract.
 * @since 0.0.1
 */
export interface GetContractOptions {
	/**
	 * Resolution mode for ABI retrieval.
	 * - "verified-only": Only verified ABIs, fail if not found
	 * - "verified-first": Try verified first, fail if not found (default)
	 * - "best-effort": Fall back to ABI recovery when unverified
	 */
	readonly resolution?: "verified-only" | "verified-first" | "best-effort";
	/** Include source files in response */
	readonly includeSources?: boolean;
	/** Follow proxy contracts to implementation */
	readonly followProxies?: boolean;
}

/**
 * Options for getAbi.
 * @since 0.0.1
 */
export interface GetAbiOptions {
	readonly resolution?: "verified-only" | "verified-first" | "best-effort";
	readonly followProxies?: boolean;
}

/**
 * Options for getSources.
 * @since 0.0.1
 */
export interface GetSourcesOptions {
	readonly followProxies?: boolean;
}

/**
 * Options for ExplorerContract.
 * @since 0.0.1
 */
export interface ExplorerContractOptions {
	readonly resolution?: "verified-only" | "verified-first" | "best-effort";
	readonly followProxies?: boolean;
}
