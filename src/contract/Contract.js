/**
 * Contract Factory
 *
 * Creates typed contract instances for interacting with deployed smart contracts.
 *
 * @module contract/Contract
 */

import { Abi } from "../primitives/Abi/Abi.js";
import * as Event from "../primitives/Abi/event/index.js";
import * as Hex from "../primitives/Hex/index.js";
import * as TransactionHash from "../primitives/TransactionHash/index.js";
import * as BlockNumber from "../primitives/BlockNumber/index.js";
import * as Hash from "../primitives/Hash/index.js";
import { Address } from "../primitives/Address/index.js";
import {
	ContractFunctionNotFoundError,
	ContractEventNotFoundError,
	ContractReadError,
	ContractWriteError,
} from "./errors.js";

/**
 * @typedef {import('./ContractType.js').ContractInstance} ContractInstance
 * @typedef {import('./ContractType.js').ContractOptions} ContractOptions
 * @typedef {import('../primitives/Abi/AbiType.js').Item} Item
 */

/**
 * Create a typed Contract instance for interacting with a deployed smart contract.
 *
 * The Contract abstraction provides a clean interface for:
 * - **read**: Execute view/pure functions via eth_call
 * - **write**: Send transactions via eth_sendTransaction
 * - **estimateGas**: Estimate gas for write operations
 * - **events**: Stream events via async generators
 *
 * @template {readonly Item[]} TAbi
 * @param {import('./ContractType.js').ContractOptions<TAbi>} options - Contract configuration
 * @returns {import('./ContractType.js').ContractInstance<TAbi>} Typed contract instance
 *
 * @example
 * ```typescript
 * import { Contract } from '@voltaire/contract';
 *
 * const erc20Abi = [
 *   { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [...], outputs: [...] },
 *   { type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [...], outputs: [...] },
 *   { type: 'event', name: 'Transfer', inputs: [...] },
 * ] as const;
 *
 * const usdc = Contract({
 *   address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *   abi: erc20Abi,
 *   provider
 * });
 *
 * // Read
 * const balance = await usdc.read.balanceOf('0x...');
 *
 * // Write
 * const txHash = await usdc.write.transfer('0x...', 1000n);
 *
 * // Estimate gas
 * const gas = await usdc.estimateGas.transfer('0x...', 1000n);
 *
 * // Stream events
 * for await (const log of usdc.events.Transfer({ from: '0x...' })) {
 *   console.log(log.args);
 * }
 * ```
 */
export function Contract(options) {
	const { abi: abiItems, provider } = options;
	const address = Address.from(options.address);
	const abi = Abi(abiItems);
	const addressHex = Hex.fromBytes(address);

	// Build read methods proxy
	const read = new Proxy(
		{},
		{
			get(_target, prop) {
				if (typeof prop !== "string") return undefined;
				const functionName = prop;

				return async (...args) => {
					const fn = abi.getFunction(functionName);

					if (
						!fn ||
						(fn.stateMutability !== "view" && fn.stateMutability !== "pure")
					) {
						throw new ContractFunctionNotFoundError(functionName);
					}

					try {
						const data = abi.encode(functionName, args);
						const dataHex = Hex.fromBytes(data);

						const result = await provider.request({
							method: "eth_call",
							params: [{ to: addressHex, data: dataHex }, "latest"],
						});

						const decoded = abi.decode(functionName, Hex.toBytes(result));

						// Unwrap single output
						return decoded.length === 1 ? decoded[0] : decoded;
					} catch (error) {
						if (error instanceof ContractFunctionNotFoundError) {
							throw error;
						}
						throw new ContractReadError(functionName, error);
					}
				};
			},
		},
	);

	// Build write methods proxy
	const write = new Proxy(
		{},
		{
			get(_target, prop) {
				if (typeof prop !== "string") return undefined;
				const functionName = prop;

				return async (...args) => {
					const fn = abi.getFunction(functionName);

					if (
						!fn ||
						(fn.stateMutability !== "nonpayable" &&
							fn.stateMutability !== "payable")
					) {
						throw new ContractFunctionNotFoundError(functionName);
					}

					try {
						const data = abi.encode(functionName, args);
						const dataHex = Hex.fromBytes(data);

						const txHash = await provider.request({
							method: "eth_sendTransaction",
							params: [{ to: addressHex, data: dataHex }],
						});

						return TransactionHash.fromHex(txHash);
					} catch (error) {
						if (error instanceof ContractFunctionNotFoundError) {
							throw error;
						}
						throw new ContractWriteError(functionName, error);
					}
				};
			},
		},
	);

	// Build estimateGas methods proxy
	const estimateGas = new Proxy(
		{},
		{
			get(_target, prop) {
				if (typeof prop !== "string") return undefined;
				const functionName = prop;

				return async (...args) => {
					const fn = abi.getFunction(functionName);

					if (
						!fn ||
						(fn.stateMutability !== "nonpayable" &&
							fn.stateMutability !== "payable")
					) {
						throw new ContractFunctionNotFoundError(functionName);
					}

					const data = abi.encode(functionName, args);
					const dataHex = Hex.fromBytes(data);

					const gasHex = await provider.request({
						method: "eth_estimateGas",
						params: [{ to: addressHex, data: dataHex }],
					});

					return BigInt(gasHex);
				};
			},
		},
	);

	// Build events proxy
	const events = new Proxy(
		{},
		{
			get(_target, prop) {
				if (typeof prop !== "string") return undefined;
				const eventName = prop;

				return async function* (filter, eventOptions) {
					const event = abi.getEvent(eventName);

					if (!event) {
						throw new ContractEventNotFoundError(eventName);
					}

					const topics = Event.encodeTopics(event, filter || {});

					// Convert topics to hex strings, replacing null with null
					const topicsHex = topics.map((t) =>
						t === null ? null : Hex.fromBytes(t),
					);

					const fromBlock =
						eventOptions?.fromBlock !== undefined
							? `0x${eventOptions.fromBlock.toString(16)}`
							: "latest";
					const toBlock =
						eventOptions?.toBlock !== undefined
							? `0x${eventOptions.toBlock.toString(16)}`
							: "latest";

					const logs = await provider.request({
						method: "eth_getLogs",
						params: [
							{
								address: addressHex,
								topics: topicsHex,
								fromBlock,
								toBlock,
							},
						],
					});

					for (const log of logs) {
						const dataBytes = Hex.toBytes(log.data);
						const topicBytes = log.topics.map((/** @type {string} */ t) =>
							Hex.toBytes(t),
						);

						const args = Event.decodeLog(
							event,
							dataBytes,
							/** @type {*} */ (topicBytes),
						);

						yield {
							eventName: event.name,
							args,
							blockNumber: BlockNumber.from(BigInt(log.blockNumber)),
							blockHash: Hash.fromHex(log.blockHash),
							transactionHash: TransactionHash.fromHex(log.transactionHash),
							logIndex: parseInt(log.logIndex, 16),
						};
					}
				};
			},
		},
	);

	return /** @type {import('./ContractType.js').ContractInstance<TAbi>} */ ({
		address,
		abi,
		read,
		write,
		estimateGas,
		events,
	});
}
