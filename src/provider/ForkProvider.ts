/**
 * Fork Provider
 *
 * Provider implementation that forks from an upstream RPC node at a specific block.
 * Uses StateManager + Blockchain FFI for state and block operations.
 *
 * @module provider/ForkProvider
 */

import type { BrandedHost } from "../evm/Host/HostType.js";
import type { AddressType } from "../primitives/Address/AddressType.js";
import { Address } from "../primitives/Address/index.js";
import type { Hex } from "../primitives/Hex/HexType.js";
import * as HexUtils from "../primitives/Hex/index.js";
import { Blockchain } from "../blockchain/Blockchain/index.js";
import type { BlockchainFFIExports, RpcClient as BlockchainRpcClient } from "../blockchain/Blockchain/index.js";
import { loadNative } from "../native-loader/index.js";
import { StateManager } from "../state-manager/StateManager/index.js";
import type { StateManagerFFIExports } from "../state-manager/StateManager/index.js";
import { RpcClientAdapter } from "../state-manager/StateManager/RpcClientAdapter.js";
import type { Provider } from "./Provider.js";
import type {
	ProviderEvent,
	ProviderEventListener,
	ProviderEventMap,
	RequestArguments,
	BlockTag,
} from "./types.js";
import type { ForkProviderOptions } from "./ForkProviderOptions.js";
import { HttpProvider } from "./HttpProvider.js";
import { StateManagerHost } from "./StateManagerHost.js";

/**
 * Fork Provider implementation
 *
 * Provides EIP-1193 interface backed by StateManager + Blockchain FFI.
 * Forks from upstream RPC at specific block, stores new state locally.
 *
 * ## Features
 *
 * - **Fork from mainnet** - Clone state at any block from upstream RPC
 * - **State caching** - LRU cache for remote state (balance, storage, code)
 * - **Block caching** - Cache fork blocks in memory
 * - **Local execution** - Execute transactions on forked state
 * - **Checkpoints/snapshots** - State rollback capabilities
 *
 * @example
 * ```typescript
 * const provider = new ForkProvider({
 *   fork: {
 *     forkUrl: 'https://eth.llamarpc.com',
 *     forkBlockNumber: 18000000n,
 *     maxCacheSize: 10000
 *   },
 *   chainId: 1
 * });
 *
 * // Read fork state
 * const balance = await provider.request({
 *   method: 'eth_getBalance',
 *   params: ['0x123...', 'latest']
 * });
 *
 * // Get blocks
 * const block = await provider.request({
 *   method: 'eth_getBlockByNumber',
 *   params: ['0x112a880', false]
 * });
 * ```
 */
export class ForkProvider implements Provider {
	// Configuration
	private chainId: number;
	private forkBlockNumber: bigint;
	private forkBlockHash?: string;

	// FFI layer
	private stateManager!: StateManager;
	private blockchain!: Blockchain;
	private host!: BrandedHost;

	// RPC client for upstream
	private rpcClient: Provider;

	// FFI initialization state
	private _ffiOptions: ForkProviderOptions | null = null;
	private _ffiInitialized = false;

	// Event listeners
	private eventListeners: Map<ProviderEvent, Set<ProviderEventListener>> =
		new Map();

	constructor(options: ForkProviderOptions) {
		this.chainId = options.chainId ?? 1;
		this.forkBlockNumber = options.fork.forkBlockNumber;
		this.forkBlockHash = options.fork.forkBlockHash;

		// Create or use provided RPC client
		this.rpcClient =
			options.rpcClient ?? new HttpProvider(options.fork.forkUrl);

		// Initialize FFI layers
		// NOTE: This requires FFI exports to be loaded
		// Production code should pass these through options
		this.initializeFFI(options);
	}

	/**
	 * Initialize StateManager + Blockchain FFI layers
	 * Stores options for lazy loading (FFI loaded on first request)
	 */
	private initializeFFI(options: ForkProviderOptions): void {
		// Store options for lazy loading
		// FFI will be loaded on first request() call
		this._ffiOptions = options;
		this._ffiInitialized = false;
	}

	/**
	 * Ensure FFI is loaded (lazy initialization)
	 * Called at start of every request() to load FFI on first access
	 */
	private async ensureFFILoaded(): Promise<void> {
		if (this._ffiInitialized) return;

		// Load native FFI exports
		const ffi = await loadNative();

		// Create RPC adapter for StateManager and Blockchain
		const rpcAdapter = new RpcClientAdapter({
			provider: this.rpcClient,
		});

		// Initialize StateManager with fork backend
		this.stateManager = new StateManager({
			rpcClient: rpcAdapter,
			forkBlockTag: `0x${this.forkBlockNumber.toString(16)}`,
			maxCacheSize: this._ffiOptions?.fork.maxCacheSize ?? 10000,
			ffi: ffi as unknown as StateManagerFFIExports,
		});

		// Initialize Blockchain
		this.blockchain = new Blockchain({
			rpcClient: rpcAdapter as unknown as BlockchainRpcClient,
			forkBlockNumber: this.forkBlockNumber,
			ffi: ffi as unknown as BlockchainFFIExports,
		});

		// Create Host interface (wraps StateManager)
		this.host = StateManagerHost(this.stateManager);

		this._ffiInitialized = true;
	}

	/**
	 * EIP-1193 request method
	 */
	async request(args: RequestArguments): Promise<unknown> {
		// Lazy load FFI on first request
		await this.ensureFFILoaded();

		const { method, params = [] } = args;
		const p = Array.isArray(params) ? params : [params];

		switch (method) {
			// ====================================================================
			// Network
			// ====================================================================

			case "net_version":
				return String(this.chainId);

			case "eth_chainId":
				return `0x${this.chainId.toString(16)}`;

			case "eth_syncing":
				return false;

			// ====================================================================
			// Block
			// ====================================================================

			case "eth_blockNumber": {
				const headNumber = await this.blockchain.getHeadBlockNumber();
				if (headNumber === null) {
					return `0x${this.forkBlockNumber.toString(16)}`;
				}
				return `0x${headNumber.toString(16)}`;
			}

			case "eth_getBlockByNumber": {
				const blockTag = p[0] as string;
				const fullTx = p[1] as boolean;
				const blockNumber = this.resolveBlockTag(blockTag);

				const block = await this.blockchain.getBlockByNumber(blockNumber);
				if (!block) {
					// Fallback to RPC if not in cache
					return this.rpcClient.request({
						method: "eth_getBlockByNumber",
						params: [blockTag, fullTx],
					});
				}

				return this.formatBlock(block, fullTx);
			}

			case "eth_getBlockByHash": {
				const hash = p[0] as string;
				const fullTx = p[1] as boolean;

				const block = await this.blockchain.getBlockByHash(hash as Hex);
				if (!block) {
					// Fallback to RPC
					return this.rpcClient.request({
						method: "eth_getBlockByHash",
						params: [hash, fullTx],
					});
				}

				return this.formatBlock(block, fullTx);
			}

			// ====================================================================
			// Account State
			// ====================================================================

			case "eth_getBalance": {
				const addr = p[0] as string;
				const _blockTag = p[1] as BlockTag;

				const address = Address(addr) as AddressType;
				const balance = this.host.getBalance(address);

				return `0x${balance.toString(16)}`;
			}

			case "eth_getTransactionCount": {
				const addr = p[0] as string;
				const _blockTag = p[1] as BlockTag;

				const address = Address(addr) as AddressType;
				const nonce = this.host.getNonce(address);

				return `0x${nonce.toString(16)}`;
			}

			case "eth_getCode": {
				const addr = p[0] as string;
				const _blockTag = p[1] as BlockTag;

				const address = Address(addr) as AddressType;
				const code = this.host.getCode(address);

				return HexUtils.fromBytes(code);
			}

			case "eth_getStorageAt": {
				const addr = p[0] as string;
				const slotHex = p[1] as string;
				const _blockTag = p[2] as BlockTag;

				const address = Address(addr) as AddressType;
				const slot = BigInt(slotHex);
				const value = this.host.getStorage(address, slot);

				return `0x${value.toString(16).padStart(64, "0")}`;
			}

			// ====================================================================
			// Transactions
			// ====================================================================

			case "eth_call": {
				// Call execution requires full EVM
				// For MVP, delegate to upstream RPC
				return this.rpcClient.request(args);
			}

			case "eth_estimateGas": {
				// Gas estimation requires full EVM
				// For MVP, delegate to upstream RPC
				return this.rpcClient.request(args);
			}

			case "eth_sendTransaction": {
				// Transaction submission requires full EVM + mining
				// For MVP, not supported
				throw {
					code: 4200,
					message: "eth_sendTransaction not supported in ForkProvider",
				};
			}

			case "eth_sendRawTransaction": {
				// Raw tx submission requires full EVM + mining
				// For MVP, not supported
				throw {
					code: 4200,
					message: "eth_sendRawTransaction not supported in ForkProvider",
				};
			}

			// ====================================================================
			// Gas
			// ====================================================================

			case "eth_gasPrice":
			case "eth_maxPriorityFeePerGas":
			case "eth_feeHistory":
			case "eth_blobBaseFee":
				// Delegate to upstream RPC
				return this.rpcClient.request(args);

			// ====================================================================
			// Filters and Logs
			// ====================================================================

			case "eth_newBlockFilter":
			case "eth_newPendingTransactionFilter":
			case "eth_newFilter":
			case "eth_getFilterChanges":
			case "eth_getFilterLogs":
			case "eth_getLogs":
			case "eth_uninstallFilter":
				// Delegate to upstream RPC
				return this.rpcClient.request(args);

			// ====================================================================
			// State Manipulation (testing methods)
			// ====================================================================

			case "anvil_setBalance":
			case "hardhat_setBalance": {
				const addr = (p[0] as string).toLowerCase();
				const balance = BigInt(p[1] as string);
				const address = Address(addr) as AddressType;
				this.host.setBalance(address, balance);
				return true;
			}

			case "anvil_setCode":
			case "hardhat_setCode": {
				const addr = (p[0] as string).toLowerCase();
				const code = HexUtils.toBytes(p[1] as `0x${string}`);
				const address = Address(addr) as AddressType;
				this.host.setCode(address, code);
				return true;
			}

			case "anvil_setNonce":
			case "hardhat_setNonce": {
				const addr = (p[0] as string).toLowerCase();
				const nonce = BigInt(p[1] as string);
				const address = Address(addr) as AddressType;
				this.host.setNonce(address, nonce);
				return true;
			}

			case "anvil_setStorageAt":
			case "hardhat_setStorageAt": {
				const addr = (p[0] as string).toLowerCase();
				const slot = BigInt(p[1] as string);
				const value = BigInt(p[2] as string);
				const address = Address(addr) as AddressType;
				this.host.setStorage(address, slot, value);
				return true;
			}

			case "evm_snapshot": {
				const snapshotId = await this.stateManager.snapshot();
				return `0x${snapshotId.toString(16)}`;
			}

			case "evm_revert": {
				const snapshotId = BigInt(p[0] as string);
				await this.stateManager.revertToSnapshot(snapshotId);
				return true;
			}

			// ====================================================================
			// Misc
			// ====================================================================

			case "web3_clientVersion":
				return "Voltaire/ForkProvider/1.0.0";

			case "eth_accounts":
				return [];

			case "eth_coinbase":
				return "0x0000000000000000000000000000000000000000";

			// ====================================================================
			// Unsupported
			// ====================================================================

			case "eth_sign":
			case "eth_signTransaction":
			case "eth_signTypedData":
			case "eth_signTypedData_v4":
				throw {
					code: 4200,
					message: "Signing not supported in ForkProvider",
				};

			case "engine_newPayloadV1":
			case "engine_newPayloadV2":
			case "engine_newPayloadV3":
			case "engine_forkchoiceUpdatedV1":
			case "engine_forkchoiceUpdatedV2":
			case "engine_forkchoiceUpdatedV3":
			case "engine_getPayloadV1":
			case "engine_getPayloadV2":
			case "engine_getPayloadV3":
			case "engine_getBlobsV1":
			case "engine_exchangeCapabilities":
			case "engine_exchangeTransitionConfigurationV1":
			case "engine_getPayloadBodiesByHashV1":
			case "engine_getPayloadBodiesByRangeV1":
				throw { code: 4200, message: "Engine API not supported" };

			// ====================================================================
			// Fallback to upstream RPC
			// ====================================================================

			default:
				// For unimplemented methods, delegate to upstream RPC
				return this.rpcClient.request(args);
		}
	}

	/**
	 * Resolve block tag to block number
	 */
	private resolveBlockTag(tag: string): bigint {
		if (
			tag === "latest" ||
			tag === "pending" ||
			tag === "safe" ||
			tag === "finalized"
		) {
			// Use fork block as head for now
			// Production should track current head
			return this.forkBlockNumber;
		}
		if (tag === "earliest") {
			return 0n;
		}
		return BigInt(tag);
	}

	/**
	 * Format block for JSON-RPC response
	 */
	// biome-ignore lint/suspicious/noExplicitAny: JSON-RPC block response has complex shape
	private formatBlock(block: any, _fullTransactions = false): any {
		// Simplified formatting - production should handle full block structure
		return {
			number: `0x${block.number.toString(16)}`,
			hash: block.hash,
			parentHash: block.parentHash,
			timestamp: `0x${block.timestamp.toString(16)}`,
			gasLimit: `0x${block.gasLimit.toString(16)}`,
			gasUsed: `0x${block.gasUsed.toString(16)}`,
			baseFeePerGas: block.baseFeePerGas
				? `0x${block.baseFeePerGas.toString(16)}`
				: undefined,
			miner: block.beneficiary,
			difficulty: `0x${block.difficulty.toString(16)}`,
			totalDifficulty: block.totalDifficulty
				? `0x${block.totalDifficulty.toString(16)}`
				: "0x0",
			extraData: block.extraData,
			size: `0x${block.size.toString(16)}`,
			nonce: `0x${block.nonce.toString(16).padStart(16, "0")}`,
			mixHash: block.mixHash,
			sha3Uncles: block.ommersHash,
			logsBloom: block.logsBloom,
			transactionsRoot: block.transactionsRoot,
			stateRoot: block.stateRoot,
			receiptsRoot: block.receiptsRoot,
			transactions: [],
			uncles: [],
			withdrawals: block.withdrawals,
			withdrawalsRoot: block.withdrawalsRoot,
			blobGasUsed: block.blobGasUsed
				? `0x${block.blobGasUsed.toString(16)}`
				: undefined,
			excessBlobGas: block.excessBlobGas
				? `0x${block.excessBlobGas.toString(16)}`
				: undefined,
			parentBeaconBlockRoot: block.parentBeaconBlockRoot,
		};
	}

	/**
	 * Register event listener
	 */
	on<E extends ProviderEvent>(
		event: E,
		listener: (...args: ProviderEventMap[E]) => void,
	): this {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}
		this.eventListeners.get(event)?.add(listener as ProviderEventListener);
		return this;
	}

	/**
	 * Remove event listener
	 */
	removeListener<E extends ProviderEvent>(
		event: E,
		listener: (...args: ProviderEventMap[E]) => void,
	): this {
		this.eventListeners.get(event)?.delete(listener as ProviderEventListener);
		return this;
	}

	/**
	 * Emit event to all listeners
	 */
	private emit<E extends ProviderEvent>(
		event: E,
		...args: ProviderEventMap[E]
	): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.forEach((listener) => {
				listener(...args);
			});
		}
	}

	/**
	 * Cleanup resources
	 */
	destroy(): void {
		this.eventListeners.clear();
		if (this.stateManager) {
			this.stateManager.destroy();
		}
		if (this.blockchain) {
			this.blockchain.destroy();
		}
	}
}
