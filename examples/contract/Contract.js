/**
 * Contract Factory - Copyable Implementation
 *
 * This is a reference implementation of a typed contract abstraction.
 * Copy this into your codebase and customize as needed.
 *
 * @module examples/contract/Contract
 */

import {
	Abi,
	Address,
	Event,
	EventStream,
	Hex,
	TransactionHash,
} from "@tevm/voltaire";
import {
	ContractEventNotFoundError,
	ContractFunctionNotFoundError,
	ContractReadError,
	ContractWriteError,
} from "./errors.js";

/**
 * @typedef {import('./ContractType.js').ContractInstance} ContractInstance
 * @typedef {import('./ContractType.js').ContractOptions} ContractOptions
 * @typedef {import('@tevm/voltaire').AbiItem} Item
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

	// Build events proxy - returns EventStream instances
	const events = new Proxy(
		{},
		{
			get(_target, prop) {
				if (typeof prop !== "string") return undefined;
				const eventName = prop;

				return (/** @type {*} */ filter) => {
					const event = abi.getEvent(eventName);

					if (!event) {
						throw new ContractEventNotFoundError(eventName);
					}

					return EventStream({
						provider,
						address,
						event,
						filter,
					});
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
