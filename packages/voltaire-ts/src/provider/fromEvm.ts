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
import type { BrandedHost } from "../evm/Host/HostType.js";
import type { AddressType } from "../primitives/Address/AddressType.js";
import { Address } from "../primitives/Address/index.js";
import * as Hex from "../primitives/Hex/index.js";
import type { Provider } from "./Provider.js";
import type {
	ProviderEvent,
	ProviderEventMap,
	RequestArguments,
} from "./types.js";

interface RpcCallParams {
	from?: string;
	to?: string;
	gas?: string;
	value?: string;
	data?: string;
}

export interface FromEvmOptions {
	host: BrandedHost;
	chainId?: number;
	baseFeePerGas?: bigint;
	startingBlockNumber?: bigint;
	coinbase?: string;
}

class EvmBackedProvider implements Provider {
	private host: BrandedHost;
	private chainId: number;
	private baseFeePerGas: bigint;
	private blockNumber: bigint;
	private coinbase: string;
	private listeners: Map<
		ProviderEvent,
		Set<(...args: ProviderEventMap[ProviderEvent]) => void>
	> = new Map();

	constructor(opts: FromEvmOptions) {
		this.host = opts.host;
		this.chainId = opts.chainId ?? 1;
		this.baseFeePerGas = opts.baseFeePerGas ?? 1_000_000_000n;
		this.blockNumber = opts.startingBlockNumber ?? 0n;
		this.coinbase = (
			opts.coinbase ?? "0x0000000000000000000000000000000000000000"
		).toLowerCase();
	}

	on<E extends ProviderEvent>(
		event: E,
		listener: (...args: ProviderEventMap[E]) => void,
	): this {
		const set = this.listeners.get(event) ?? new Set();
		set.add(listener as (...args: ProviderEventMap[ProviderEvent]) => void);
		this.listeners.set(event, set);
		return this;
	}

	removeListener<E extends ProviderEvent>(
		event: E,
		listener: (...args: ProviderEventMap[E]) => void,
	): this {
		const set = this.listeners.get(event);
		if (set) {
			set.delete(
				listener as (...args: ProviderEventMap[ProviderEvent]) => void,
			);
			if (set.size === 0) this.listeners.delete(event);
		}
		return this;
	}

	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: RPC switch inherently needs many branches
	async request(args: RequestArguments): Promise<unknown> {
		if (Array.isArray(args)) {
			// Batch support (best-effort): execute sequentially
			const batch = args as unknown as RequestArguments[];
			return Promise.all(batch.map((a) => this.request(a)));
		}

		const { method, params = [] } = args;
		const paramList = Array.isArray(params) ? params : [];
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
				const [addrHex] = paramList as [string, string?];
				const addr = Address(addrHex) as AddressType;
				const bal = this.host.getBalance(addr);
				return `0x${bal.toString(16)}`;
			}
			case "eth_getCode": {
				const [addrHex] = paramList as [string, string?];
				const addr = Address(addrHex) as AddressType;
				const code = this.host.getCode(addr);
				return Hex.fromBytes(code);
			}
			case "eth_getTransactionCount": {
				const [addrHex] = paramList as [string, string?];
				const addr = Address(addrHex) as AddressType;
				const nonce = this.host.getNonce(addr);
				return `0x${BigInt(nonce).toString(16)}`;
			}

			// Calls (simplified: prepare frame and return default output)
			case "eth_call": {
				const [tx] = paramList as [RpcCallParams, string?];
				const to = tx.to?.toLowerCase();
				const data = tx.data ?? "0x";
				const gas = tx.gas ? BigInt(tx.gas) : 30_000_000n;
				if (!to) return "0x"; // create not supported here
				const toAddr = Address(to) as AddressType;
				const code = this.host.getCode(toAddr);
				if (!code || code.length === 0) return "0x";
				const frame = Frame({
					bytecode: code,
					gas,
					caller: Address(
						tx.from ?? "0x0000000000000000000000000000000000000000",
					) as AddressType,
					address: toAddr,
					value: tx.value ? BigInt(tx.value) : 0n,
					calldata: Hex.toBytes(data as `0x${string}`),
					isStatic: true,
				});
				// Full opcode execution engine integration is pending; return empty output
				return Hex.fromBytes(frame.output);
			}

			// Gas
			case "eth_estimateGas": {
				const [tx] = paramList as [RpcCallParams?];
				const data = tx?.data ?? "0x";
				const base = 21_000n;
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
				const [config] = paramList as [
					{ forking?: { jsonRpcUrl?: string; blockNumber?: number } }?,
				];
				if (config?.forking?.blockNumber != null) {
					const bn = BigInt(config.forking.blockNumber);
					if (bn >= 0n) this.blockNumber = bn;
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
export function fromEvm(evmOrOptions: BrandedHost | FromEvmOptions): Provider {
	const opts: FromEvmOptions =
		"getBalance" in evmOrOptions ? { host: evmOrOptions } : evmOrOptions;
	return new EvmBackedProvider(opts);
}
