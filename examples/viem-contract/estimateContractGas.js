/**
 * estimateContractGas - Viem-compatible Gas Estimation Action
 *
 * Estimates the gas required to successfully execute a contract write function.
 * Copy this into your codebase and customize as needed.
 *
 * @module examples/viem-contract/estimateContractGas
 */

import * as Abi from "../../src/primitives/Abi/index.js";
import * as Hex from "../../src/primitives/Hex/index.js";
import { ContractGasEstimationError } from "./errors.js";

/**
 * @typedef {import('./ViemContractTypes.js').EstimateContractGasParameters} EstimateContractGasParameters
 */

/**
 * Estimates the gas required to successfully execute a contract write function call.
 *
 * @template {readonly import('../../src/primitives/Abi/AbiType.js').Item[]} TAbi
 * @template {string} TFunctionName
 * @param {import('./ViemContractTypes.js').Client} client - Client to use
 * @param {import('./ViemContractTypes.js').EstimateContractGasParameters<TAbi, TFunctionName>} parameters
 * @returns {Promise<bigint>} The gas estimate in wei
 *
 * @example
 * ```typescript
 * import { estimateContractGas } from './estimateContractGas.js';
 *
 * const gas = await estimateContractGas(client, {
 *   address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *   abi: erc20Abi,
 *   functionName: 'transfer',
 *   args: ['0x...', 1000n],
 *   account: '0x...',
 * });
 * ```
 */
export async function estimateContractGas(client, parameters) {
	const {
		abi: abiItems,
		address,
		args = [],
		functionName,
		dataSuffix,
		account: account_,
		...request
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
		// Build estimation params
		const estimateParams = {
			to: addressHex,
			data: calldataHex,
			...(accountAddress && { from: accountAddress }),
			...request,
		};

		// Execute eth_estimateGas
		const gasHex = await client.request({
			method: "eth_estimateGas",
			params: [estimateParams],
		});

		return BigInt(gasHex);
	} catch (error) {
		throw new ContractGasEstimationError(
			functionName,
			{ abi: abiItems, address: addressHex, args, sender: accountAddress },
			{ cause: error },
		);
	}
}
