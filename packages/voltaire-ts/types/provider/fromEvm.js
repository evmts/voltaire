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
import { Frame } from "../evm/Frame/index.js";
import { Address } from "../primitives/Address/index.js";
import * as Hex from "../primitives/Hex/index.js";
class EvmBackedProvider {
    host;
    chainId;
    baseFeePerGas;
    blockNumber;
    coinbase;
    listeners = new Map();
    constructor(opts) {
        this.host = opts.host;
        this.chainId = opts.chainId ?? 1;
        this.baseFeePerGas = opts.baseFeePerGas ?? 1000000000n;
        this.blockNumber = opts.startingBlockNumber ?? 0n;
        this.coinbase = (opts.coinbase ?? "0x0000000000000000000000000000000000000000").toLowerCase();
    }
    on(event, listener) {
        const set = this.listeners.get(event) ?? new Set();
        set.add(listener);
        this.listeners.set(event, set);
        return this;
    }
    removeListener(event, listener) {
        const set = this.listeners.get(event);
        if (set) {
            set.delete(listener);
            if (set.size === 0)
                this.listeners.delete(event);
        }
        return this;
    }
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: RPC switch inherently needs many branches
    async request(args) {
        // biome-ignore lint/suspicious/noExplicitAny: batch check requires any
        if (Array.isArray(args)) {
            // Batch support (best-effort): execute sequentially
            const batch = args;
            return Promise.all(batch.map((a) => this.request(a)));
        }
        // biome-ignore lint/suspicious/noExplicitAny: params type varies by method
        const { method, params = [] } = args;
        switch (method) {
            // Chain/meta
            case "eth_chainId":
                return `0x${this.chainId.toString(16)}`;
            case "net_version":
                return `${this.chainId}`;
            case "web3_clientVersion":
                return "Voltaire/Provider.fromEvm/0.1.0";
            case "eth_blockNumber":
                return `0x${this.blockNumber.toString(16)}`;
            case "eth_coinbase":
                return this.coinbase;
            // Basic reads via Host
            case "eth_getBalance": {
                const [addrHex] = params;
                const addr = Address(addrHex);
                // biome-ignore lint/suspicious/noExplicitAny: host expects branded type
                const bal = this.host.getBalance(addr);
                return `0x${bal.toString(16)}`;
            }
            case "eth_getCode": {
                const [addrHex] = params;
                const addr = Address(addrHex);
                // biome-ignore lint/suspicious/noExplicitAny: host expects branded type
                const code = this.host.getCode(addr);
                return Hex.fromBytes(code);
            }
            case "eth_getTransactionCount": {
                const [addrHex] = params;
                const addr = Address(addrHex);
                // biome-ignore lint/suspicious/noExplicitAny: host expects branded type
                const nonce = this.host.getNonce(addr);
                return `0x${BigInt(nonce).toString(16)}`;
            }
            // Calls (simplified: prepare frame and return default output)
            case "eth_call": {
                // biome-ignore lint/suspicious/noExplicitAny: tx params are dynamic
                const [tx] = params;
                const to = tx.to?.toLowerCase();
                const data = tx.data ?? "0x";
                const gas = tx.gas ? BigInt(tx.gas) : 30000000n;
                if (!to)
                    return "0x"; // create not supported here
                // biome-ignore lint/suspicious/noExplicitAny: host expects branded type
                const code = this.host.getCode(Address(to));
                if (!code || code.length === 0)
                    return "0x";
                const frame = Frame({
                    bytecode: code,
                    gas,
                    caller: Address(tx.from ?? "0x0000000000000000000000000000000000000000"),
                    // biome-ignore lint/suspicious/noExplicitAny: Frame accepts branded types
                    address: Address(to),
                    value: tx.value ? BigInt(tx.value) : 0n,
                    calldata: Hex.toBytes(data),
                    isStatic: true,
                });
                // Full opcode execution engine integration is pending; return empty output
                return Hex.fromBytes(frame.output);
            }
            // Gas
            case "eth_estimateGas": {
                // biome-ignore lint/suspicious/noExplicitAny: tx params are dynamic
                const [tx] = params;
                const data = tx?.data ?? "0x";
                const base = 21000n;
                const dataGas = BigInt(((data.length - 2) / 2) * 16);
                return `0x${(base + dataGas).toString(16)}`;
            }
            // Mining hooks (no-op, monotonic block increment)
            case "evm_mine": {
                this.blockNumber += 1n;
                return "0x0";
            }
            // Hardhat/Anvil compatible reset (no-op; wiring to fork can be added)
            case "hardhat_reset": {
                const [config] = params;
                if (config?.forking?.blockNumber != null) {
                    const bn = BigInt(config.forking.blockNumber);
                    if (bn >= 0n)
                        this.blockNumber = bn;
                }
                return true;
            }
            default:
                throw new Error(`Provider.fromEvm: Unsupported method ${method}`);
        }
    }
}
/**
 * Create a Provider from an EVM host-like object.
 * Accepts either a BrandedHost directly or an object with a `host` property.
 */
export function fromEvm(evmOrOptions) {
    const opts = 
    // biome-ignore lint/suspicious/noExplicitAny: duck-type check for BrandedHost
    "getBalance" in evmOrOptions
        ? { host: evmOrOptions }
        : evmOrOptions;
    return new EvmBackedProvider(opts);
}
