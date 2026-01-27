/**
 * @fileoverview Network service definition for network/meta JSON-RPC calls.
 *
 * @module NetworkService
 * @since 0.3.0
 */

import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type {
	BlockTag,
	FeeHistoryType,
	GetAccountsError,
	GetBlobBaseFeeError,
	GetChainIdError,
	GetCoinbaseError,
	GetFeeHistoryError,
	GetGasPriceError,
	GetHashrateError,
	GetMaxPriorityFeePerGasError,
	GetMiningError,
	GetProtocolVersionError,
	GetSyncingError,
	GetWorkError,
	NetVersionError,
	SubmitHashrateError,
	SubmitWorkError,
} from "./ProviderService.js";

/**
 * Syncing status as returned by eth_syncing.
 *
 * @since 0.3.0
 */
export type SyncingStatus =
	| false
	| {
			startingBlock: string;
			currentBlock: string;
			highestBlock: string;
			[key: string]: string;
	  };

/**
 * Result tuple for eth_getWork.
 *
 * @since 0.3.0
 */
export type WorkResult = [`0x${string}`, `0x${string}`, `0x${string}`];

/**
 * Shape of the Network service.
 *
 * @since 0.3.0
 */
export type NetworkShape = {
	/** Gets the chain ID */
	readonly getChainId: () => Effect.Effect<number, GetChainIdError>;
	/** Gets the current gas price */
	readonly getGasPrice: () => Effect.Effect<bigint, GetGasPriceError>;
	/** Gets the max priority fee per gas (EIP-1559) */
	readonly getMaxPriorityFeePerGas: () => Effect.Effect<
		bigint,
		GetMaxPriorityFeePerGasError
	>;
	/** Gets fee history for gas estimation */
	readonly getFeeHistory: (
		blockCount: number,
		newestBlock: BlockTag,
		rewardPercentiles: number[],
	) => Effect.Effect<FeeHistoryType, GetFeeHistoryError>;
	/** Gets the blob base fee (EIP-4844) */
	readonly getBlobBaseFee: () => Effect.Effect<bigint, GetBlobBaseFeeError>;
	/** Gets syncing status (if supported) */
	readonly getSyncing?: () => Effect.Effect<SyncingStatus, GetSyncingError>;
	/** Gets available accounts (if supported) */
	readonly getAccounts?: () => Effect.Effect<`0x${string}`[], GetAccountsError>;
	/** Gets coinbase address (if supported) */
	readonly getCoinbase?: () => Effect.Effect<`0x${string}`, GetCoinbaseError>;
	/** Gets network version (net_version) */
	readonly netVersion?: () => Effect.Effect<string, NetVersionError>;
	/** Gets protocol version (eth_protocolVersion) */
	readonly getProtocolVersion?: () => Effect.Effect<
		string,
		GetProtocolVersionError
	>;
	/** Returns whether the client is mining (eth_mining) */
	readonly getMining?: () => Effect.Effect<boolean, GetMiningError>;
	/** Gets the current hashrate (eth_hashrate) */
	readonly getHashrate?: () => Effect.Effect<bigint, GetHashrateError>;
	/** Gets work package for mining (eth_getWork) */
	readonly getWork?: () => Effect.Effect<WorkResult, GetWorkError>;
	/** Submits a mining solution (eth_submitWork) */
	readonly submitWork?: (
		nonce: `0x${string}`,
		powHash: `0x${string}`,
		mixDigest: `0x${string}`,
	) => Effect.Effect<boolean, SubmitWorkError>;
	/** Submits mining hashrate (eth_submitHashrate) */
	readonly submitHashrate?: (
		hashrate: `0x${string}`,
		id: `0x${string}`,
	) => Effect.Effect<boolean, SubmitHashrateError>;
};

/**
 * Network service for network/meta JSON-RPC operations.
 *
 * @since 0.3.0
 */
export class NetworkService extends Context.Tag("NetworkService")<
	NetworkService,
	NetworkShape
>() {}
