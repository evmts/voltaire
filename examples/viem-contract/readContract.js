/**
 * readContract - Viem-compatible Contract Read Action
 *
 * Calls a read-only function on a contract and returns the response.
 * Copy this into your codebase and customize as needed.
 *
 * @module examples/viem-contract/readContract
 */

import * as Abi from "../../src/primitives/Abi/index.js";
import * as Hex from "../../src/primitives/Hex/index.js";
import { ContractReadError } from "./errors.js";

/**
 * @typedef {import('./ViemContractTypes.js').ReadContractParameters} ReadContractParameters
 */

/**
 * Calls a read-only function on a contract, and returns the response.
 *
 * A "read-only" function (constant function) on a Solidity contract is denoted
 * by a `view` or `pure` keyword. They can only read the state of the contract,
 * and cannot make any changes to it. Since read-only methods do not change the
 * state of the contract, they do not require any gas to be executed.
 *
 * @template {readonly import('../../src/primitives/Abi/AbiType.js').Item[]} TAbi
 * @template {string} TFunctionName
 * @param {import('./ViemContractTypes.js').Client} client - Provider/client to use
 * @param {import('./ViemContractTypes.js').ReadContractParameters<TAbi, TFunctionName>} parameters
 * @returns {Promise<unknown>} The decoded response from the contract
 *
 * @example
 * ```typescript
 * import { readContract } from './readContract.js';
 *
 * const balance = await readContract(client, {
 *   address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *   abi: erc20Abi,
 *   functionName: 'balanceOf',
 *   args: ['0x...'],
 * });
 * ```
 */
export async function readContract(client, parameters) {
	const { abi: abiItems, address, args = [], functionName, ...rest } = parameters;

	// Create ABI instance and encode function call
	const abi = Abi.Abi(abiItems);
	const calldata = abi.encode(functionName, args);
	const calldataHex = Hex.fromBytes(calldata);

	// Normalize address to hex string
	const addressHex =
		typeof address === "string" ? address : Hex.fromBytes(address);

	try {
		// Build call params
		const callParams = {
			to: addressHex,
			data: calldataHex,
			...rest,
		};

		// Execute eth_call
		const result = await client.request({
			method: "eth_call",
			params: [callParams, rest.blockTag ?? rest.blockNumber ?? "latest"],
		});

		// Decode result
		const decoded = abi.decode(functionName, Hex.toBytes(result));

		// Unwrap single output
		return decoded.length === 1 ? decoded[0] : decoded;
	} catch (error) {
		throw new ContractReadError(
			functionName,
			{ abi: abiItems, address: addressHex, args },
			{ cause: error },
		);
	}
}
