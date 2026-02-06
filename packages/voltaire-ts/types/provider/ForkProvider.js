/**
 * Fork Provider
 *
 * Provider implementation that forks from an upstream RPC node at a specific block.
 * Uses StateManager + Blockchain FFI for state and block operations.
 *
 * @module provider/ForkProvider
 */
import { Blockchain } from "../blockchain/Blockchain/index.js";
import { isBun, isNode, loadForkWasm, loadNative, } from "../native-loader/index.js";
import { Address } from "../primitives/Address/index.js";
import * as HexUtils from "../primitives/Hex/index.js";
import { StateManager } from "../state-manager/StateManager/index.js";
import { HttpProvider } from "./HttpProvider.js";
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
export class ForkProvider {
    // Configuration
    chainId;
    forkBlockNumber;
    forkBlockHash;
    // FFI layer
    stateManager;
    blockchain;
    // RPC client for upstream
    rpcClient;
    // FFI initialization state
    _ffiOptions = null;
    _ffiInitialized = false;
    // Event listeners
    eventListeners = new Map();
    constructor(options) {
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
    initializeFFI(options) {
        // Store options for lazy loading
        // FFI will be loaded on first request() call
        this._ffiOptions = options;
        this._ffiInitialized = false;
    }
    /**
     * Ensure FFI is loaded (lazy initialization)
     * Called at start of every request() to load FFI on first access
     */
    async ensureFFILoaded() {
        if (this._ffiInitialized)
            return;
        if (!this._ffiOptions) {
            throw new Error("ForkProvider options not initialized");
        }
        let stateManagerFFI;
        let blockchainFFI;
        if (this._ffiOptions.ffi) {
            stateManagerFFI = this._ffiOptions.ffi.stateManager;
            blockchainFFI = this._ffiOptions.ffi.blockchain;
        }
        else {
            const useWasm = this._ffiOptions.useWasm ?? (!isBun() && !isNode());
            if (useWasm) {
                const wasm = await loadForkWasm(this._ffiOptions.wasm);
                stateManagerFFI = wasm.stateManager;
                blockchainFFI = wasm.blockchain;
            }
            else {
                const native = await loadNative();
                stateManagerFFI = native;
                blockchainFFI = native;
            }
        }
        this.stateManager = new StateManager({
            rpcClient: this.rpcClient,
            forkBlockTag: `0x${this.forkBlockNumber.toString(16)}`,
            maxCacheSize: this._ffiOptions.fork.maxCacheSize ?? 10000,
            ffi: stateManagerFFI,
        });
        this.blockchain = new Blockchain({
            rpcClient: this.rpcClient,
            forkBlockNumber: this.forkBlockNumber,
            ffi: blockchainFFI,
        });
        this._ffiInitialized = true;
    }
    /**
     * EIP-1193 request method
     */
    async request(args) {
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
                const blockTag = p[0];
                const fullTx = p[1];
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
                const hash = p[0];
                const fullTx = p[1];
                const block = await this.blockchain.getBlockByHash(hash);
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
                const addr = p[0];
                const _blockTag = p[1];
                const address = Address(addr);
                const balance = await this.stateManager.getBalance(address);
                return `0x${balance.toString(16)}`;
            }
            case "eth_getTransactionCount": {
                const addr = p[0];
                const _blockTag = p[1];
                const address = Address(addr);
                const nonce = await this.stateManager.getNonce(address);
                return `0x${nonce.toString(16)}`;
            }
            case "eth_getCode": {
                const addr = p[0];
                const _blockTag = p[1];
                const address = Address(addr);
                return this.stateManager.getCode(address);
            }
            case "eth_getStorageAt": {
                const addr = p[0];
                const slotHex = p[1];
                const _blockTag = p[2];
                const address = Address(addr);
                const value = await this.stateManager.getStorage(address, slotHex);
                return value;
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
                const addr = p[0].toLowerCase();
                const balance = BigInt(p[1]);
                const address = Address(addr);
                await this.stateManager.setBalance(address, balance);
                return true;
            }
            case "anvil_setCode":
            case "hardhat_setCode": {
                const addr = p[0].toLowerCase();
                const code = HexUtils.toBytes(p[1]);
                const address = Address(addr);
                await this.stateManager.setCode(address, HexUtils.fromBytes(code));
                return true;
            }
            case "anvil_setNonce":
            case "hardhat_setNonce": {
                const addr = p[0].toLowerCase();
                const nonce = BigInt(p[1]);
                const address = Address(addr);
                await this.stateManager.setNonce(address, nonce);
                return true;
            }
            case "anvil_setStorageAt":
            case "hardhat_setStorageAt": {
                const addr = p[0].toLowerCase();
                const slot = BigInt(p[1]);
                const value = BigInt(p[2]);
                const address = Address(addr);
                await this.stateManager.setStorage(address, `0x${slot.toString(16)}`, `0x${value.toString(16)}`);
                return true;
            }
            case "evm_snapshot": {
                const snapshotId = await this.stateManager.snapshot();
                return `0x${snapshotId.toString(16)}`;
            }
            case "evm_revert": {
                const snapshotId = BigInt(p[0]);
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
    resolveBlockTag(tag) {
        if (tag === "latest" ||
            tag === "pending" ||
            tag === "safe" ||
            tag === "finalized") {
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
    formatBlock(block, _fullTransactions = false) {
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
    on(event, listener) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)?.add(listener);
        return this;
    }
    /**
     * Remove event listener
     */
    removeListener(event, listener) {
        this.eventListeners.get(event)?.delete(listener);
        return this;
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.eventListeners.clear();
        if (this.stateManager) {
            this.stateManager.destroy();
        }
        if (this.blockchain) {
            this.blockchain.destroy();
        }
    }
}
