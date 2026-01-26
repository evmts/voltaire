/**
 * simulateContract Action
 *
 * Simulates a contract interaction and decodes the return data.
 *
 * @module examples/viem-publicclient/actions/simulateContract
 */

import { Abi, Hex } from "@tevm/voltaire";
import { call } from "./call.js";

/**
 * @typedef {import('../PublicClientType.js').Client} Client
 * @typedef {import('../PublicClientType.js').SimulateContractParameters} SimulateContractParameters
 * @typedef {import('../PublicClientType.js').SimulateContractReturnType} SimulateContractReturnType
 */

/**
 * Simulate a contract call and decode the result
 *
 * @param {Client} client - Client instance
 * @param {SimulateContractParameters} parameters - Simulation parameters
 * @returns {Promise<SimulateContractReturnType>} Decoded result + request
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

	const accountAddress = account_
		? typeof account_ === "string"
			? account_
			: Hex.fromBytes(account_)
		: undefined;

	const addressHex =
		typeof address === "string" ? address : Hex.fromBytes(address);

	const abi = Abi(abiItems);
	const calldata = abi.encode(functionName, args);
	let calldataHex = Hex.fromBytes(calldata);

	if (dataSuffix) {
		calldataHex = /** @type {`0x${string}`} */ (
			`${calldataHex}${dataSuffix.replace("0x", "")}`
		);
	}

	const { data } = await call(client, {
		...callRequest,
		account: accountAddress,
		to: addressHex,
		data: calldataHex,
	});

	const decoded = abi.decode(functionName, Hex.toBytes(data ?? "0x"));
	const result = decoded.length === 1 ? decoded[0] : decoded;

	const minimizedAbi = abiItems.filter(
		(item) => "name" in item && item.name === functionName,
	);

	return {
		result,
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
}
