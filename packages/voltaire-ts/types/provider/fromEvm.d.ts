/**
 * Provider.fromEvm factory
 *
 * Creates a minimal EIP-1193-compatible Provider backed by a supplied Host.
 * This is a lightweight factory intended to allow plugging a custom EVM/Host
 * (e.g. a forked state manager) into the Provider surface.
 *
 * Note: This implementation focuses on read methods (eth_*) commonly used by
 * callers and intentionally keeps scope minimal. It can be extended incrementally.
 */
import type { BrandedHost } from "../evm/Host/HostType.js";
import type { Provider } from "./Provider.js";
export interface FromEvmOptions {
    host: BrandedHost;
    chainId?: number;
    baseFeePerGas?: bigint;
    startingBlockNumber?: bigint;
    coinbase?: string;
}
/**
 * Create a Provider from an EVM host-like object.
 * Accepts either a BrandedHost directly or an object with a `host` property.
 */
export declare function fromEvm(evmOrOptions: BrandedHost | FromEvmOptions): Provider;
//# sourceMappingURL=fromEvm.d.ts.map