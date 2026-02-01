/**
 * JSON-RPC method handlers
 *
 * Dispatches RPC methods to StateManager and Blockchain operations
 */

import type { AddressType } from "../primitives/Address/AddressType.js";
import { Address } from "../primitives/Address/index.js";
import type { RpcHandler } from "./types.js";
import { JsonRpcErrorCode } from "./types.js";

/**
 * Handler dependencies (injected via constructor)
 */
export interface HandlerDependencies {
	// State operations
	getBalance: (address: AddressType) => Promise<bigint> | bigint;
	getNonce: (address: AddressType) => Promise<bigint> | bigint;
	getCode: (address: AddressType) => Promise<Uint8Array> | Uint8Array;
	getStorage: (address: AddressType, slot: bigint) => Promise<bigint> | bigint;

	// Block operations
	getBlockByNumber: (
		number: bigint,
	) => Promise<unknown | null> | (unknown | null);
	getBlockByHash: (hash: string) => Promise<unknown | null> | (unknown | null);
	getHeadBlockNumber: () => Promise<bigint> | bigint;
}

/**
 * Create RPC handler with dependency injection
 *
 * @param deps - Handler dependencies (StateManager + Blockchain operations)
 * @returns RPC handler
 */
export function createRpcHandler(deps: HandlerDependencies): RpcHandler {
	return {
		async handle(method: string, params: unknown[]): Promise<unknown> {
			switch (method) {
				// ================================================================
				// Account State
				// ================================================================

				case "eth_getBalance": {
					const [addressHex, _blockTag = "latest"] = params as [
						string,
						string?,
					];
					const address = Address(addressHex) as AddressType;
					const balance = await deps.getBalance(address);
					return `0x${balance.toString(16)}`;
				}

				case "eth_getTransactionCount": {
					const [addressHex, _blockTag = "latest"] = params as [
						string,
						string?,
					];
					const address = Address(addressHex) as AddressType;
					const nonce = await deps.getNonce(address);
					return `0x${nonce.toString(16)}`;
				}

				case "eth_getCode": {
					const [addressHex, _blockTag = "latest"] = params as [
						string,
						string?,
					];
					const address = Address(addressHex) as AddressType;
					const code = await deps.getCode(address);
					return `0x${Array.from(code)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("")}`;
				}

				case "eth_getStorageAt": {
					const [addressHex, slotHex, _blockTag = "latest"] = params as [
						string,
						string,
						string?,
					];
					const address = Address(addressHex) as AddressType;
					const slot = BigInt(slotHex);
					const value = await deps.getStorage(address, slot);
					return `0x${value.toString(16).padStart(64, "0")}`;
				}

				// ================================================================
				// Block
				// ================================================================

				case "eth_blockNumber": {
					const blockNumber = await deps.getHeadBlockNumber();
					return `0x${blockNumber.toString(16)}`;
				}

				case "eth_getBlockByNumber": {
					const [blockNumberHex, fullTx = false] = params as [string, boolean?];

					// Resolve block tag
					let blockNumber: bigint;
					if (
						blockNumberHex === "latest" ||
						blockNumberHex === "pending" ||
						blockNumberHex === "safe" ||
						blockNumberHex === "finalized"
					) {
						blockNumber = await deps.getHeadBlockNumber();
					} else if (blockNumberHex === "earliest") {
						blockNumber = 0n;
					} else {
						blockNumber = BigInt(blockNumberHex);
					}

					const block = await deps.getBlockByNumber(blockNumber);
					if (!block) {
						return null;
					}

					return formatBlock(block, fullTx);
				}

				case "eth_getBlockByHash": {
					const [blockHash, fullTx = false] = params as [string, boolean?];
					const block = await deps.getBlockByHash(blockHash);
					if (!block) {
						return null;
					}
					return formatBlock(block, fullTx);
				}

				// ================================================================
				// Unsupported/Unknown
				// ================================================================

				default:
					throw {
						code: JsonRpcErrorCode.METHOD_NOT_FOUND,
						message: `Method not found: ${method}`,
					};
			}
		},
	};
}

/**
 * Format block for JSON-RPC response
 */
// biome-ignore lint/suspicious/noExplicitAny: Block structure is dynamic
function formatBlock(block: any, _fullTransactions = false): any {
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
