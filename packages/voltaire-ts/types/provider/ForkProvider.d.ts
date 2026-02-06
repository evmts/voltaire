/**
 * Fork Provider
 *
 * Provider implementation that forks from an upstream RPC node at a specific block.
 * Uses StateManager + Blockchain FFI for state and block operations.
 *
 * @module provider/ForkProvider
 */
import type { ForkProviderOptions } from "./ForkProviderOptions.js";
import type { Provider } from "./Provider.js";
import type { ProviderEvent, ProviderEventMap, RequestArguments } from "./types.js";
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
export declare class ForkProvider implements Provider {
    private chainId;
    private forkBlockNumber;
    private forkBlockHash?;
    private stateManager;
    private blockchain;
    private rpcClient;
    private _ffiOptions;
    private _ffiInitialized;
    private eventListeners;
    constructor(options: ForkProviderOptions);
    /**
     * Initialize StateManager + Blockchain FFI layers
     * Stores options for lazy loading (FFI loaded on first request)
     */
    private initializeFFI;
    /**
     * Ensure FFI is loaded (lazy initialization)
     * Called at start of every request() to load FFI on first access
     */
    private ensureFFILoaded;
    /**
     * EIP-1193 request method
     */
    request(args: RequestArguments): Promise<unknown>;
    /**
     * Resolve block tag to block number
     */
    private resolveBlockTag;
    /**
     * Format block for JSON-RPC response
     */
    private formatBlock;
    /**
     * Register event listener
     */
    on<E extends ProviderEvent>(event: E, listener: (...args: ProviderEventMap[E]) => void): this;
    /**
     * Remove event listener
     */
    removeListener<E extends ProviderEvent>(event: E, listener: (...args: ProviderEventMap[E]) => void): this;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
//# sourceMappingURL=ForkProvider.d.ts.map