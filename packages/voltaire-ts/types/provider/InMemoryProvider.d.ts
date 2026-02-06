/**
 * In-Memory Provider
 *
 * Provider implementation that executes transactions using Voltaire's built-in EVM.
 * This provider maintains its own blockchain state in memory for testing and development.
 *
 * @module provider/InMemoryProvider
 */
import type { Provider } from "./Provider.js";
import type { ProviderEvent, ProviderEventMap, ProviderEvents, RequestArguments } from "./types.js";
/**
 * In-Memory Provider configuration options
 */
export interface InMemoryProviderOptions {
    /** Chain ID (default: 1) */
    chainId?: number;
    /** Mining mode: auto, interval, or manual (default: auto) */
    mining?: "auto" | "interval" | "manual";
    /** Mining interval in ms (when mode is 'interval') */
    miningInterval?: number;
    /** Initial accounts with balances */
    accounts?: Array<{
        address: string;
        balance: string;
        privateKey?: string;
    }>;
    /** Initial block number (default: 0) */
    blockNumber?: bigint;
    /** Block gas limit (default: 30000000) */
    blockGasLimit?: bigint;
    /** Base fee per gas (default: 1000000000 = 1 gwei) */
    baseFeePerGas?: bigint;
}
/**
 * In-Memory Provider implementation
 *
 * Provides a fully functional in-memory Ethereum node for testing and development.
 * Uses Voltaire's EVM for transaction execution.
 *
 * ## Features
 *
 * - **Local EVM execution** - Full transaction simulation without external node
 * - **State management** - In-memory state with snapshot/revert capabilities
 * - **Instant mining** - Configurable block production (auto/interval/manual)
 * - **Testing utilities** - Set balances, impersonate accounts, manipulate time
 * - **Zero latency** - No network requests, instant responses
 *
 * @example
 * ```typescript
 * const provider = new InMemoryProvider({
 *   chainId: 1,
 *   accounts: [
 *     {
 *       address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
 *       balance: '0x10000000000000000000000' // 100000 ETH
 *     }
 *   ]
 * });
 *
 * // Execute calls against local EVM
 * const result = await provider.request({
 *   method: 'eth_call',
 *   params: [{ to: '0x...', data: '0x...' }, 'latest']
 * });
 * ```
 */
export declare class InMemoryProvider implements Provider {
    private chainId;
    private miningMode;
    private miningInterval;
    private miningIntervalId;
    private blockGasLimit;
    private baseFeePerGas;
    private accounts;
    private transientStorage;
    private blocks;
    private blocksByHash;
    private transactions;
    private receipts;
    private pendingTransactions;
    private currentBlockNumber;
    private currentTimestamp;
    private nextBlockTimestamp;
    private filters;
    private filterIdCounter;
    private coinbase;
    private snapshots;
    private snapshotIdCounter;
    private eventListeners;
    constructor(options?: InMemoryProviderOptions);
    /**
     * Get or create account state
     */
    private getOrCreateAccount;
    /**
     * Create a new block
     */
    private createBlock;
    /**
     * Generate a simple hash (not cryptographically secure - for testing only)
     */
    private generateHash;
    /**
     * Format block for JSON-RPC response
     */
    private formatBlock;
    /**
     * Start interval mining
     */
    private startIntervalMining;
    /**
     * Stop interval mining
     */
    private stopIntervalMining;
    /**
     * Mine pending transactions into a new block
     */
    private mine;
    /**
     * Execute a transaction
     */
    private executeTx;
    /**
     * Compute contract address for CREATE
     */
    private computeContractAddress;
    /**
     * EIP-1193 request method
     */
    request(args: RequestArguments): Promise<unknown>;
    /**
     * Resolve block tag to block header
     */
    private resolveBlock;
    /**
     * Register event listener
     */
    on<E extends ProviderEvent>(event: E, listener: (...args: ProviderEventMap[E]) => void): this;
    /**
     * Remove event listener
     */
    removeListener<E extends ProviderEvent>(event: E, listener: (...args: ProviderEventMap[E]) => void): this;
    /**
     * Emit event to all listeners
     */
    private emit;
    /**
     * Cleanup resources
     */
    destroy(): void;
    events: ProviderEvents;
}
//# sourceMappingURL=InMemoryProvider.d.ts.map