/**
 * StateManagerHost - Host implementation backed by StateManager FFI
 *
 * Adapts StateManager FFI to BrandedHost interface for EVM execution.
 * Provides sync interface while internally managing async FFI operations.
 *
 * @module provider/StateManagerHost
 */
import type { BrandedHost } from "../evm/Host/HostType.js";
import type { StateManager } from "../state-manager/StateManager/index.js";
/**
 * StateManagerHost - Host implementation backed by StateManager FFI
 *
 * Wraps StateManager to implement BrandedHost interface.
 * All methods are synchronous (as required by Host interface),
 * but use synchronous FFI calls internally.
 *
 * @example
 * ```typescript
 * const stateManager = new StateManager({
 *   rpcClient: new RpcClientAdapter(httpProvider),
 *   forkBlockTag: '0x112a880',
 *   ffi: ffiExports
 * });
 *
 * const host = StateManagerHost(stateManager);
 *
 * // Use in EVM frame
 * const frame = Frame({
 *   bytecode,
 *   gas: 1000000n,
 *   host,
 *   ...
 * });
 * ```
 */
export declare function StateManagerHost(stateManager: StateManager): BrandedHost;
/**
 * Clear transient storage (call at end of transaction)
 */
export declare function clearTransientStorage(_host: BrandedHost): void;
//# sourceMappingURL=StateManagerHost.d.ts.map