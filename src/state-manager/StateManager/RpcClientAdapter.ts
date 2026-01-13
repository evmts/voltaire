/**
 * RPC Client Adapter
 *
 * Adapts EIP-1193 Provider to RpcClient interface for StateManager fork backend.
 * Wraps HttpProvider/WebSocketProvider to provide typed state queries.
 *
 * @module state-manager/StateManager/RpcClientAdapter
 */

import type { Provider } from "../../provider/Provider.js";
import type { AddressType } from "../../primitives/Address/AddressType.js";
import type { Hex } from "../../primitives/Hex/HexType.js";
import type { RpcClient, EthProof } from "./index.js";
import * as Address from "../../primitives/Address/index.js";

/**
 * RPC Client Adapter Options
 */
export interface RpcClientAdapterOptions {
	/**
	 * EIP-1193 provider (HttpProvider, WebSocketProvider, etc.)
	 */
	provider: Provider;

	/**
	 * Optional timeout for RPC calls (ms)
	 */
	timeout?: number;

	/**
	 * Optional retry attempts
	 */
	retries?: number;
}

/**
 * Adapts EIP-1193 Provider to RpcClient interface
 *
 * Provides typed wrappers for eth_getProof and eth_getCode
 * with proper error handling and type conversion.
 *
 * @example
 * ```typescript
 * import { HttpProvider } from '../../provider/HttpProvider.js';
 * import { RpcClientAdapter } from './RpcClientAdapter.js';
 *
 * const httpProvider = new HttpProvider('https://eth-mainnet.g.alchemy.com/v2/KEY');
 * const rpcClient = new RpcClientAdapter({ provider: httpProvider });
 *
 * // Get account proof
 * const proof = await rpcClient.getProof(
 *   address,
 *   ['0x0', '0x1'],
 *   '0x112a880'
 * );
 *
 * // Get contract code
 * const code = await rpcClient.getCode(address, 'latest');
 * ```
 */
export class RpcClientAdapter implements RpcClient {
	private provider: Provider;
	private timeout: number;
	private retries: number;

	constructor(options: RpcClientAdapterOptions) {
		this.provider = options.provider;
		this.timeout = options.timeout ?? 30000;
		this.retries = options.retries ?? 3;
	}

	/**
	 * Get account proof (eth_getProof)
	 *
	 * @param address - Account address
	 * @param slots - Storage slots to prove
	 * @param blockTag - Block tag ("latest", "0x123...", etc.)
	 * @returns Account proof with storage proofs
	 */
	async getProof(
		address: AddressType,
		slots: readonly Hex[],
		blockTag: string,
	): Promise<EthProof> {
		const addressHex = Address.toHex(address);

		const result = await this.provider.request({
			method: "eth_getProof",
			params: [addressHex, slots, blockTag],
		});

		// Validate response structure
		if (!result || typeof result !== "object") {
			throw new Error("Invalid eth_getProof response");
		}

		const proof = result as {
			nonce: string;
			balance: string;
			codeHash: string;
			storageHash: string;
			storageProof: Array<{
				key: string;
				value: string;
				proof: string[];
			}>;
		};

		// Convert to typed EthProof
		return {
			nonce: BigInt(proof.nonce),
			balance: BigInt(proof.balance),
			codeHash: proof.codeHash as Hex,
			storageRoot: proof.storageHash as Hex,
			storageProof: proof.storageProof.map((sp) => ({
				key: sp.key as Hex,
				value: sp.value as Hex,
				proof: sp.proof as Hex[],
			})),
		};
	}

	/**
	 * Get contract code (eth_getCode)
	 *
	 * @param address - Contract address
	 * @param blockTag - Block tag ("latest", "0x123...", etc.)
	 * @returns Contract bytecode as hex string
	 */
	async getCode(address: AddressType, blockTag: string): Promise<Hex> {
		const addressHex = Address.toHex(address);

		const result = await this.provider.request({
			method: "eth_getCode",
			params: [addressHex, blockTag],
		});

		if (typeof result !== "string") {
			throw new Error("Invalid eth_getCode response");
		}

		return result as Hex;
	}

	/**
	 * Get block by number (eth_getBlockByNumber)
	 *
	 * @param blockTag - Block tag or number
	 * @param fullTransactions - Whether to include full transaction objects
	 * @returns Block data
	 */
	async getBlockByNumber(
		blockTag: string,
		fullTransactions = false,
	): Promise<unknown> {
		return await this.provider.request({
			method: "eth_getBlockByNumber",
			params: [blockTag, fullTransactions],
		});
	}

	/**
	 * Get block by hash (eth_getBlockByHash)
	 *
	 * @param blockHash - Block hash
	 * @param fullTransactions - Whether to include full transaction objects
	 * @returns Block data
	 */
	async getBlockByHash(
		blockHash: Hex,
		fullTransactions = false,
	): Promise<unknown> {
		return await this.provider.request({
			method: "eth_getBlockByHash",
			params: [blockHash, fullTransactions],
		});
	}

	/**
	 * Get current block number (eth_blockNumber)
	 *
	 * @returns Latest block number as hex string
	 */
	async getBlockNumber(): Promise<Hex> {
		const result = await this.provider.request({
			method: "eth_blockNumber",
			params: [],
		});

		if (typeof result !== "string") {
			throw new Error("Invalid eth_blockNumber response");
		}

		return result as Hex;
	}

	/**
	 * Execute request with retry logic
	 *
	 * @param fn - Function to execute
	 * @returns Result from function
	 */
	private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
		let lastError: Error | null = null;

		for (let attempt = 0; attempt < this.retries; attempt++) {
			try {
				return await Promise.race([
					fn(),
					new Promise<never>((_, reject) =>
						setTimeout(
							() => reject(new Error("Request timeout")),
							this.timeout,
						),
					),
				]);
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));

				// Don't retry on certain errors
				if (
					lastError.message.includes("Invalid") ||
					lastError.message.includes("not found")
				) {
					throw lastError;
				}

				// Wait before retry (exponential backoff)
				if (attempt < this.retries - 1) {
					await new Promise((resolve) =>
						setTimeout(resolve, Math.pow(2, attempt) * 1000),
					);
				}
			}
		}

		throw lastError ?? new Error("Request failed after retries");
	}
}
