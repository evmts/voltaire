/**
 * getContract - Viem-compatible Contract Factory
 *
 * Gets type-safe interface for performing contract-related actions
 * with a specific ABI and address.
 * Copy this into your codebase and customize as needed.
 *
 * @module examples/viem-contract/getContract
 */

import { Hex } from "@tevm/voltaire";
import { estimateContractGas } from "./estimateContractGas.js";
import { readContract } from "./readContract.js";
import { simulateContract } from "./simulateContract.js";
import { watchContractEvent } from "./watchContractEvent.js";
import { writeContract } from "./writeContract.js";

/**
 * @typedef {import('./ViemContractTypes.js').GetContractParameters} GetContractParameters
 * @typedef {import('./ViemContractTypes.js').GetContractReturnType} GetContractReturnType
 * @typedef {import('./ViemContractTypes.js').Client} Client
 */

/**
 * Extract function args and options from parameters array.
 *
 * Handles both forms:
 * - `(args[], options?)` when function has inputs
 * - `(options?)` when function has no inputs
 *
 * @param {unknown[]} values - The parameters passed to the method
 * @returns {{ args: unknown[], options: Record<string, unknown> }}
 */
export function getFunctionParameters(values) {
	const hasArgs = values.length > 0 && Array.isArray(values[0]);
	const args = hasArgs ? /** @type {unknown[]} */ (values[0]) : [];
	const options = /** @type {Record<string, unknown>} */ (
		(hasArgs ? values[1] : values[0]) ?? {}
	);
	return { args, options };
}

/**
 * Extract event filter args and options from parameters array.
 *
 * Handles both forms:
 * - `(filterArgs?, options?)` when event has indexed inputs
 * - `(options?)` when event has no indexed inputs
 *
 * @param {unknown[]} values - The parameters passed to the method
 * @param {import('@tevm/voltaire').Item | undefined} abiEvent - The ABI event definition
 * @returns {{ args: unknown, options: Record<string, unknown> }}
 */
export function getEventParameters(values, abiEvent) {
	let hasArgs = false;

	// If first item is array, must be `args`
	if (Array.isArray(values[0])) {
		hasArgs = true;
	}
	// Check if first item is `args` or `options`
	else if (values.length === 1) {
		// If event has indexed inputs, first arg might be filter args
		if (
			abiEvent &&
			abiEvent.type === "event" &&
			abiEvent.inputs?.some((x) => "indexed" in x && x.indexed)
		) {
			// Check if it looks like filter args (object with matching param names) vs options
			const firstArg = values[0];
			if (firstArg && typeof firstArg === "object") {
				const keys = Object.keys(firstArg);
				const inputNames = abiEvent.inputs
					.filter((x) => "indexed" in x && x.indexed)
					.map((x) => x.name);
				hasArgs = keys.some((k) => inputNames.includes(k));
			}
		}
	}
	// If there are two items in array, must have `args`
	else if (values.length === 2) {
		hasArgs = true;
	}

	const args = hasArgs ? values[0] : undefined;
	const options = /** @type {Record<string, unknown>} */ (
		(hasArgs ? values[1] : values[0]) ?? {}
	);
	return { args, options };
}

/**
 * Gets type-safe interface for performing contract-related actions with a specific ABI and address.
 *
 * Using Contract Instances can make it easier to work with contracts if you don't want
 * to pass the `abi` and `address` properties every time you perform contract actions.
 *
 * @template {readonly import('@tevm/voltaire').Item[]} TAbi
 * @param {import('./ViemContractTypes.js').GetContractParameters<TAbi>} params
 * @returns {import('./ViemContractTypes.js').GetContractReturnType<TAbi>}
 *
 * @example
 * ```typescript
 * import { getContract } from './getContract.js';
 *
 * const contract = getContract({
 *   address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *   abi: erc20Abi,
 *   client: publicClient,
 * });
 *
 * // Read
 * const balance = await contract.read.balanceOf(['0x...']);
 *
 * // Write (with wallet client)
 * const hash = await contract.write.transfer(['0x...', 1000n]);
 *
 * // Simulate
 * const { result, request } = await contract.simulate.transfer(['0x...', 1000n]);
 *
 * // Watch events
 * const unwatch = contract.watchEvent.Transfer({ from: '0x...' }, {
 *   onLogs: (logs) => console.log(logs),
 * });
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: compatibility layer
export function getContract(params) {
	const { abi, address, client: client_ } = params;

	// Normalize address to hex string
	const addressHex =
		typeof address === "string"
			? /** @type {`0x${string}`} */ (address)
			: /** @type {`0x${string}`} */ (Hex.fromBytes(address));

	// Extract public and wallet clients
	/** @type {Client | undefined} */
	let publicClient;
	/** @type {Client | undefined} */
	let walletClient;

	if (!client_) {
		publicClient = undefined;
		walletClient = undefined;
	} else if ("public" in client_ && "wallet" in client_) {
		publicClient = /** @type {Client} */ (client_.public);
		walletClient = /** @type {Client} */ (client_.wallet);
	} else if ("public" in client_) {
		publicClient = /** @type {Client} */ (client_.public);
		walletClient = undefined;
	} else if ("wallet" in client_) {
		publicClient = undefined;
		walletClient = /** @type {Client} */ (client_.wallet);
	} else {
		// Single client - use for both
		publicClient = /** @type {Client} */ (client_);
		walletClient = /** @type {Client} */ (client_);
	}

	const hasPublicClient = publicClient !== undefined && publicClient !== null;
	const hasWalletClient = walletClient !== undefined && walletClient !== null;

	// Analyze ABI to determine available methods
	let hasReadFunction = false;
	let hasWriteFunction = false;
	let hasEvent = false;

	for (const item of abi) {
		if (item.type === "function") {
			if (item.stateMutability === "view" || item.stateMutability === "pure") {
				hasReadFunction = true;
			} else {
				hasWriteFunction = true;
			}
		} else if (item.type === "event") {
			hasEvent = true;
		}

		// Exit early if all flags are true
		if (hasReadFunction && hasWriteFunction && hasEvent) {
			break;
		}
	}

	/** @type {Record<string, unknown>} */
	const contract = {};

	// Build read proxy
	if (hasPublicClient && hasReadFunction) {
		contract.read = new Proxy(
			{},
			{
				get(_target, functionName) {
					if (typeof functionName !== "string") return undefined;

					return async (/** @type {unknown[]} */ ...parameters) => {
						const { args, options } = getFunctionParameters(parameters);
						return readContract(/** @type {Client} */ (publicClient), {
							abi,
							address: addressHex,
							functionName,
							args,
							...options,
						});
					};
				},
			},
		);
	}

	// Build simulate proxy
	if (hasPublicClient && hasWriteFunction) {
		contract.simulate = new Proxy(
			{},
			{
				get(_target, functionName) {
					if (typeof functionName !== "string") return undefined;

					return async (/** @type {unknown[]} */ ...parameters) => {
						const { args, options } = getFunctionParameters(parameters);
						return simulateContract(/** @type {Client} */ (publicClient), {
							abi,
							address: addressHex,
							functionName,
							args,
							...options,
						});
					};
				},
			},
		);
	}

	// Build write proxy
	if (hasWalletClient && hasWriteFunction) {
		contract.write = new Proxy(
			{},
			{
				get(_target, functionName) {
					if (typeof functionName !== "string") return undefined;

					return async (/** @type {unknown[]} */ ...parameters) => {
						const { args, options } = getFunctionParameters(parameters);
						return writeContract(/** @type {Client} */ (walletClient), {
							abi,
							address: addressHex,
							functionName,
							args,
							...options,
						});
					};
				},
			},
		);
	}

	// Build estimateGas proxy
	if ((hasPublicClient || hasWalletClient) && hasWriteFunction) {
		contract.estimateGas = new Proxy(
			{},
			{
				get(_target, functionName) {
					if (typeof functionName !== "string") return undefined;

					return async (/** @type {unknown[]} */ ...parameters) => {
						const { args, options } = getFunctionParameters(parameters);
						const client = /** @type {Client} */ (publicClient ?? walletClient);
						return estimateContractGas(client, {
							abi,
							address: addressHex,
							functionName,
							args,
							account: options.account ?? walletClient?.account,
							...options,
						});
					};
				},
			},
		);
	}

	// Build watchEvent proxy
	if (hasPublicClient && hasEvent) {
		contract.watchEvent = new Proxy(
			{},
			{
				get(_target, eventName) {
					if (typeof eventName !== "string") return undefined;

					return (/** @type {unknown[]} */ ...parameters) => {
						const abiEvent = abi.find(
							(x) => x.type === "event" && x.name === eventName,
						);
						const { args, options } = getEventParameters(parameters, abiEvent);

						return watchContractEvent(/** @type {Client} */ (publicClient), {
							abi,
							address: addressHex,
							eventName,
							args,
							.../** @type {*} */ (options),
						});
					};
				},
			},
		);
	}

	// Add address and abi properties
	contract.address = addressHex;
	contract.abi = abi;

	return /** @type {import('./ViemContractTypes.js').GetContractReturnType<TAbi>} */ (
		contract
	);
}
