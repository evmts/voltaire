/**
 * simulateContract - Viem-compatible Contract Simulation Action
 *
 * Simulates/validates a contract interaction to retrieve return data
 * and revert reasons without actually executing a transaction.
 * Copy this into your codebase and customize as needed.
 *
 * @module examples/viem-contract/simulateContract
 */

import * as Abi from "../../src/primitives/Abi/index.js";
import * as Hex from "../../src/primitives/Hex/index.js";
import { ContractSimulateError } from "./errors.js";

/**
 * @typedef {import('./ViemContractTypes.js').SimulateContractParameters} SimulateContractParameters
 * @typedef {import('./ViemContractTypes.js').SimulateContractReturnType} SimulateContractReturnType
 */

/**
 * Simulates/validates a contract interaction.
 *
 * This is useful for retrieving return data and revert reasons of contract
 * write functions. This function does not require gas to execute and does not
 * change the state of the blockchain.
 *
 * It is almost identical to `readContract`, but also supports contract write
 * functions and returns a `request` object that can be passed to `writeContract`.
 *
 * @template {readonly import('../../src/primitives/Abi/AbiType.js').Item[]} TAbi
 * @template {string} TFunctionName
 * @param {import('./ViemContractTypes.js').Client} client - Public client to use
 * @param {import('./ViemContractTypes.js').SimulateContractParameters<TAbi, TFunctionName>} parameters
 * @returns {Promise<import('./ViemContractTypes.js').SimulateContractReturnType<TAbi, TFunctionName>>}
 *
 * @example
 * ```typescript
 * import { simulateContract } from './simulateContract.js';
 * import { writeContract } from './writeContract.js';
 *
 * const { result, request } = await simulateContract(client, {
 *   address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *   abi: erc20Abi,
 *   functionName: 'transfer',
 *   args: ['0x...', 1000n],
 *   account: '0x...',
 * });
 *
 * // result contains the return value
 * // request can be passed directly to writeContract
 * const hash = await writeContract(walletClient, request);
 * ```
 */
export async function simulateContract(client, parameters) {
	const {
		abi: abiItems,
		address,
		args = [],
		functionName,
		dataSuffix,
		account: account_,
		...callRequest
	} = parameters;

	// Get account from params or client
	const account = account_ ?? client.account;
	const accountAddress = account
		? typeof account === "string"
			? account
			: typeof account === "object" && "address" in account
				? account.address
				: Hex.fromBytes(account)
		: undefined;

	// Create ABI instance and encode function call
	const abi = Abi.Abi(abiItems);
	const calldata = abi.encode(functionName, args);
	let calldataHex = Hex.fromBytes(calldata);

	// Append dataSuffix if provided
	if (dataSuffix) {
		calldataHex = /** @type {`0x${string}`} */ (
			`${calldataHex}${dataSuffix.replace("0x", "")}`
		);
	}

	// Normalize address to hex string
	const addressHex =
		typeof address === "string" ? address : Hex.fromBytes(address);

	try {
		// Build call params
		const callParams = {
			to: addressHex,
			data: calldataHex,
			...(accountAddress && { from: accountAddress }),
			...callRequest,
		};

		// Execute eth_call (batch: false to ensure accurate simulation)
		const result = await client.request({
			method: "eth_call",
			params: [callParams, callRequest.blockTag ?? callRequest.blockNumber ?? "latest"],
		});

		// Decode result
		const decoded = abi.decode(functionName, Hex.toBytes(result));
		const returnValue = decoded.length === 1 ? decoded[0] : decoded;

		// Create minimized ABI with just this function
		const minimizedAbi = abiItems.filter(
			(item) => "name" in item && item.name === functionName,
		);

		// Return result and request object for writeContract
		return {
			result: returnValue,
			request: {
				abi: minimizedAbi,
				address: addressHex,
				args,
				dataSuffix,
				functionName,
				...callRequest,
				account: accountAddress,
			},
		};
	} catch (error) {
		throw new ContractSimulateError(
			functionName,
			{ abi: abiItems, address: addressHex, args, sender: accountAddress },
			{ cause: error },
		);
	}
}
