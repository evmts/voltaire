/**
 * Contract Factory
 *
 * Creates typed contract instances for interacting with deployed smart contracts.
 *
 * @module contract/Contract
 */

import { Abi } from "../primitives/Abi/Abi.js";
import * as Address from "../primitives/Address/index.js";
import { ContractNotImplementedError } from "./errors.js";

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

	// Build read methods proxy
	const read = new Proxy(
		{},
		{
			get(_target, prop) {
				if (typeof prop !== "string") return undefined;
				const functionName = prop;

				return async (...args) => {
					throw new ContractNotImplementedError(`read.${functionName}`);
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
					throw new ContractNotImplementedError(`write.${functionName}`);
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
					throw new ContractNotImplementedError(`estimateGas.${functionName}`);
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
					throw new ContractNotImplementedError(`events.${eventName}`);
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
