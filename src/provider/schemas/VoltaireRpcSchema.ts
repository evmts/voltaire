/**
 * Voltaire RPC Schema
 *
 * Default RPC schema combining all JSON-RPC methods from eth, debug, engine, web3, net, and txpool namespaces.
 *
 * @module provider/schemas/VoltaireRpcSchema
 */

import type { BlockType } from "../../primitives/Block/BlockType.js";
import type { EventLogType } from "../../primitives/EventLog/EventLogType.js";
import type { ReceiptType } from "../../primitives/Receipt/ReceiptType.js";
import type { Any as TransactionType } from "../../primitives/Transaction/types.js";

/**
 * Voltaire's default RPC schema
 *
 * Combines all JSON-RPC methods from:
 * - eth namespace (52 methods)
 * - debug namespace
 * - engine namespace
 * - web3 namespace
 * - net namespace
 * - txpool namespace
 * - anvil namespace (test methods)
 *
 * @example
 * ```typescript
 * import type { TypedProvider, VoltaireRpcSchema } from './provider/index.js';
 *
 * type VoltaireProvider = TypedProvider<VoltaireRpcSchema>;
 *
 * const provider: VoltaireProvider = {
 *   request: async ({ method, params }) => {
 *     // Implementation
 *   },
 *   on: (event, listener) => provider,
 *   removeListener: (event, listener) => provider,
 * };
 * ```
 */
export type VoltaireRpcSchema = readonly [
	// eth namespace
	{
		Method: "eth_accounts";
		Parameters: [];
		ReturnType: string[];
	},
	{
		Method: "eth_blobBaseFee";
		Parameters: [];
		ReturnType: string;
	},
	{
		Method: "eth_blockNumber";
		Parameters: [];
		ReturnType: string;
	},
	{
		Method: "eth_call";
		Parameters: [
			{
				from?: string;
				to: string;
				gas?: string;
				gasPrice?: string;
				value?: string;
				data?: string;
			},
			string,
		];
		ReturnType: string;
	},
	{
		Method: "eth_chainId";
		Parameters: [];
		ReturnType: string;
	},
	{
		Method: "eth_coinbase";
		Parameters: [];
		ReturnType: string;
	},
	{
		Method: "eth_createAccessList";
		Parameters: [
			{
				from?: string;
				to: string;
				gas?: string;
				gasPrice?: string;
				value?: string;
				data?: string;
			},
			string,
		];
		ReturnType: {
			accessList: Array<{
				address: string;
				storageKeys: string[];
			}>;
			gasUsed: string;
		};
	},
	{
		Method: "eth_estimateGas";
		Parameters: [
			{
				from?: string;
				to?: string;
				gas?: string;
				gasPrice?: string;
				value?: string;
				data?: string;
			},
			string?,
		];
		ReturnType: string;
	},
	{
		Method: "eth_feeHistory";
		Parameters: [string, string, number[]?];
		ReturnType: {
			baseFeePerGas: string[];
			gasUsedRatio: number[];
			oldestBlock: string;
			reward?: string[][];
		};
	},
	{
		Method: "eth_gasPrice";
		Parameters: [];
		ReturnType: string;
	},
	{
		Method: "eth_getBalance";
		Parameters: [string, string];
		ReturnType: string;
	},
	{
		Method: "eth_getBlockByHash";
		Parameters: [string, boolean];
		ReturnType: BlockType | null;
	},
	{
		Method: "eth_getBlockByNumber";
		Parameters: [string, boolean];
		ReturnType: BlockType | null;
	},
	{
		Method: "eth_getBlockReceipts";
		Parameters: [string];
		ReturnType: ReceiptType[] | null;
	},
	{
		Method: "eth_getBlockTransactionCountByHash";
		Parameters: [string];
		ReturnType: string;
	},
	{
		Method: "eth_getBlockTransactionCountByNumber";
		Parameters: [string];
		ReturnType: string;
	},
	{
		Method: "eth_getCode";
		Parameters: [string, string];
		ReturnType: string;
	},
	{
		Method: "eth_getFilterChanges";
		Parameters: [string];
		ReturnType: EventLogType[] | string[];
	},
	{
		Method: "eth_getFilterLogs";
		Parameters: [string];
		ReturnType: EventLogType[];
	},
	{
		Method: "eth_getLogs";
		Parameters: [
			{
				fromBlock?: string;
				toBlock?: string;
				address?: string | string[];
				topics?: (string | string[] | null)[];
				blockHash?: string;
			},
		];
		ReturnType: EventLogType[];
	},
	{
		Method: "eth_getProof";
		Parameters: [string, string[], string];
		ReturnType: {
			accountProof: string[];
			balance: string;
			codeHash: string;
			nonce: string;
			storageHash: string;
			storageProof: Array<{
				key: string;
				proof: string[];
				value: string;
			}>;
		};
	},
	{
		Method: "eth_getStorageAt";
		Parameters: [string, string, string];
		ReturnType: string;
	},
	{
		Method: "eth_getTransactionByBlockHashAndIndex";
		Parameters: [string, string];
		ReturnType: TransactionType | null;
	},
	{
		Method: "eth_getTransactionByBlockNumberAndIndex";
		Parameters: [string, string];
		ReturnType: TransactionType | null;
	},
	{
		Method: "eth_getTransactionByHash";
		Parameters: [string];
		ReturnType: TransactionType | null;
	},
	{
		Method: "eth_getTransactionCount";
		Parameters: [string, string];
		ReturnType: string;
	},
	{
		Method: "eth_getTransactionReceipt";
		Parameters: [string];
		ReturnType: ReceiptType | null;
	},
	{
		Method: "eth_getUncleByBlockHashAndIndex";
		Parameters: [string, string];
		ReturnType: BlockType | null;
	},
	{
		Method: "eth_getUncleByBlockNumberAndIndex";
		Parameters: [string, string];
		ReturnType: BlockType | null;
	},
	{
		Method: "eth_getUncleCountByBlockHash";
		Parameters: [string];
		ReturnType: string;
	},
	{
		Method: "eth_getUncleCountByBlockNumber";
		Parameters: [string];
		ReturnType: string;
	},
	{
		Method: "eth_getWork";
		Parameters: [];
		ReturnType: [string, string, string];
	},
	{
		Method: "eth_hashrate";
		Parameters: [];
		ReturnType: string;
	},
	{
		Method: "eth_maxPriorityFeePerGas";
		Parameters: [];
		ReturnType: string;
	},
	{
		Method: "eth_mining";
		Parameters: [];
		ReturnType: boolean;
	},
	{
		Method: "eth_newBlockFilter";
		Parameters: [];
		ReturnType: string;
	},
	{
		Method: "eth_newFilter";
		Parameters: [
			{
				fromBlock?: string;
				toBlock?: string;
				address?: string | string[];
				topics?: (string | string[] | null)[];
			},
		];
		ReturnType: string;
	},
	{
		Method: "eth_newPendingTransactionFilter";
		Parameters: [];
		ReturnType: string;
	},
	{
		Method: "eth_protocolVersion";
		Parameters: [];
		ReturnType: string;
	},
	{
		Method: "eth_sendRawTransaction";
		Parameters: [string];
		ReturnType: string;
	},
	{
		Method: "eth_sendTransaction";
		Parameters: [
			{
				from: string;
				to?: string;
				gas?: string;
				gasPrice?: string;
				value?: string;
				data?: string;
				nonce?: string;
			},
		];
		ReturnType: string;
	},
	{
		Method: "eth_sign";
		Parameters: [string, string];
		ReturnType: string;
	},
	{
		Method: "eth_signTransaction";
		Parameters: [
			{
				from: string;
				to?: string;
				gas?: string;
				gasPrice?: string;
				value?: string;
				data?: string;
				nonce?: string;
			},
		];
		ReturnType: string;
	},
	{
		Method: "eth_simulateV1";
		Parameters: [unknown, string?];
		ReturnType: unknown[];
	},
	{
		Method: "eth_submitHashrate";
		Parameters: [string, string];
		ReturnType: boolean;
	},
	{
		Method: "eth_submitWork";
		Parameters: [string, string, string];
		ReturnType: boolean;
	},
	{
		Method: "eth_subscribe";
		Parameters: [string, ...unknown[]];
		ReturnType: string;
	},
	{
		Method: "eth_syncing";
		Parameters: [];
		ReturnType:
			| false
			| {
					startingBlock: string;
					currentBlock: string;
					highestBlock: string;
			  };
	},
	{
		Method: "eth_uninstallFilter";
		Parameters: [string];
		ReturnType: boolean;
	},
	{
		Method: "eth_unsubscribe";
		Parameters: [string];
		ReturnType: boolean;
	},
	// debug namespace
	{
		Method: "debug_getBadBlocks";
		Parameters: [];
		ReturnType: unknown[];
	},
	{
		Method: "debug_getRawBlock";
		Parameters: [string];
		ReturnType: string;
	},
	{
		Method: "debug_getRawHeader";
		Parameters: [string];
		ReturnType: string;
	},
	{
		Method: "debug_getRawReceipts";
		Parameters: [string];
		ReturnType: string[];
	},
	{
		Method: "debug_getRawTransaction";
		Parameters: [string];
		ReturnType: string;
	},
	// engine namespace (consensus layer)
	{
		Method: "engine_exchangeCapabilities";
		Parameters: [string[]];
		ReturnType: string[];
	},
	{
		Method: "engine_exchangeTransitionConfigurationV1";
		Parameters: [unknown];
		ReturnType: unknown;
	},
	{
		Method: "engine_forkchoiceUpdatedV1";
		Parameters: [unknown, unknown?];
		ReturnType: unknown;
	},
	{
		Method: "engine_forkchoiceUpdatedV2";
		Parameters: [unknown, unknown?];
		ReturnType: unknown;
	},
	{
		Method: "engine_forkchoiceUpdatedV3";
		Parameters: [unknown, unknown?];
		ReturnType: unknown;
	},
	{
		Method: "engine_getBlobsV1";
		Parameters: [string[]];
		ReturnType: unknown[];
	},
	{
		Method: "engine_getBlobsV2";
		Parameters: [string[]];
		ReturnType: unknown[];
	},
	{
		Method: "engine_getPayloadBodiesByHashV1";
		Parameters: [string[]];
		ReturnType: unknown[];
	},
	{
		Method: "engine_getPayloadBodiesByRangeV1";
		Parameters: [string, string];
		ReturnType: unknown[];
	},
	{
		Method: "engine_getPayloadV1";
		Parameters: [string];
		ReturnType: unknown;
	},
	{
		Method: "engine_getPayloadV2";
		Parameters: [string];
		ReturnType: unknown;
	},
	{
		Method: "engine_getPayloadV3";
		Parameters: [string];
		ReturnType: unknown;
	},
	{
		Method: "engine_getPayloadV4";
		Parameters: [string];
		ReturnType: unknown;
	},
	{
		Method: "engine_getPayloadV5";
		Parameters: [string];
		ReturnType: unknown;
	},
	{
		Method: "engine_getPayloadV6";
		Parameters: [string];
		ReturnType: unknown;
	},
	{
		Method: "engine_newPayloadV1";
		Parameters: [unknown];
		ReturnType: unknown;
	},
	{
		Method: "engine_newPayloadV2";
		Parameters: [unknown, string[]?];
		ReturnType: unknown;
	},
	{
		Method: "engine_newPayloadV3";
		Parameters: [unknown, string[]?, string?];
		ReturnType: unknown;
	},
	{
		Method: "engine_newPayloadV4";
		Parameters: [unknown, string[]?, string?];
		ReturnType: unknown;
	},
	{
		Method: "engine_newPayloadV5";
		Parameters: [unknown, string[]?, string?];
		ReturnType: unknown;
	},
	// web3 namespace
	{
		Method: "web3_clientVersion";
		Parameters: [];
		ReturnType: string;
	},
	{
		Method: "web3_sha3";
		Parameters: [string];
		ReturnType: string;
	},
	// net namespace
	{
		Method: "net_version";
		Parameters: [];
		ReturnType: string;
	},
	{
		Method: "net_listening";
		Parameters: [];
		ReturnType: boolean;
	},
	{
		Method: "net_peerCount";
		Parameters: [];
		ReturnType: string;
	},
	// txpool namespace
	{
		Method: "txpool_status";
		Parameters: [];
		ReturnType: {
			pending: string;
			queued: string;
		};
	},
	{
		Method: "txpool_content";
		Parameters: [];
		ReturnType: {
			pending: Record<string, Record<string, unknown>>;
			queued: Record<string, Record<string, unknown>>;
		};
	},
	{
		Method: "txpool_inspect";
		Parameters: [];
		ReturnType: {
			pending: Record<string, Record<string, string>>;
			queued: Record<string, Record<string, string>>;
		};
	},
	// anvil namespace (test methods)
	{
		Method: "anvil_impersonateAccount";
		Parameters: [string];
		ReturnType: null;
	},
	{
		Method: "anvil_stopImpersonatingAccount";
		Parameters: [string];
		ReturnType: null;
	},
	{
		Method: "anvil_setBalance";
		Parameters: [string, string];
		ReturnType: null;
	},
	{
		Method: "anvil_setCode";
		Parameters: [string, string];
		ReturnType: null;
	},
	{
		Method: "anvil_setNonce";
		Parameters: [string, string];
		ReturnType: null;
	},
	{
		Method: "anvil_setStorageAt";
		Parameters: [string, string, string];
		ReturnType: null;
	},
	{
		Method: "evm_increaseTime";
		Parameters: [number];
		ReturnType: string;
	},
	{
		Method: "evm_mine";
		Parameters: [{ blocks?: number; timestamp?: number }?];
		ReturnType: string;
	},
	{
		Method: "evm_revert";
		Parameters: [string];
		ReturnType: boolean;
	},
	{
		Method: "evm_setAutomine";
		Parameters: [boolean];
		ReturnType: null;
	},
	{
		Method: "evm_setBlockGasLimit";
		Parameters: [string];
		ReturnType: boolean;
	},
	{
		Method: "evm_setIntervalMining";
		Parameters: [number];
		ReturnType: null;
	},
	{
		Method: "evm_setNextBlockTimestamp";
		Parameters: [number];
		ReturnType: null;
	},
	{
		Method: "evm_snapshot";
		Parameters: [];
		ReturnType: string;
	},
];
