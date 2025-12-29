/**
 * writeContract - Viem-compatible Contract Write Action
 *
 * Executes a write function on a contract via eth_sendTransaction.
 * Copy this into your codebase and customize as needed.
 *
 * @module examples/viem-contract/writeContract
 */

import * as Abi from "../../src/primitives/Abi/index.js";
import * as Hex from "../../src/primitives/Hex/index.js";
import { AccountNotFoundError, ContractWriteError } from "./errors.js";

/**
 * @typedef {import('./ViemContractTypes.js').WriteContractParameters} WriteContractParameters
 */

/**
 * Executes a write function on a contract.
 *
 * A "write" function on a Solidity contract modifies the state of the blockchain.
 * These types of functions require gas to be executed, and hence a Transaction
 * is needed to be broadcast in order to change the state.
 *
 * **Warning**: This internally sends a transaction - it does not validate if the
 * contract write will succeed. It is highly recommended to simulate the contract
 * write with `simulateContract` before executing.
 *
 * @template {readonly import('../../src/primitives/Abi/AbiType.js').Item[]} TAbi
 * @template {string} TFunctionName
 * @param {import('./ViemContractTypes.js').Client} client - Wallet client to use
 * @param {import('./ViemContractTypes.js').WriteContractParameters<TAbi, TFunctionName>} parameters
 * @returns {Promise<`0x${string}`>} Transaction hash
 *
 * @example
 * ```typescript
 * import { writeContract } from './writeContract.js';
 *
 * const hash = await writeContract(client, {
 *   address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *   abi: erc20Abi,
 *   functionName: 'transfer',
 *   args: ['0x...', 1000n],
 *   account: '0x...',
 * });
 * ```
 */
export async function writeContract(client, parameters) {
	const {
		abi: abiItems,
		address,
		args = [],
		functionName,
		account: account_,
		dataSuffix,
		...request
	} = parameters;

	// Get account from params or client
	const account = account_ ?? client.account;
	if (!account) {
		throw new AccountNotFoundError("/docs/contract/writeContract");
	}

	// Normalize account to address string
	const accountAddress =
		typeof account === "string"
			? account
			: typeof account === "object" && "address" in account
				? account.address
				: Hex.fromBytes(account);

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
		// Build transaction params
		const txParams = {
			from: accountAddress,
			to: addressHex,
			data: calldataHex,
			...request,
		};

		// Execute eth_sendTransaction
		const hash = await client.request({
			method: "eth_sendTransaction",
			params: [txParams],
		});

		return /** @type {`0x${string}`} */ (hash);
	} catch (error) {
		throw new ContractWriteError(
			functionName,
			{ abi: abiItems, address: addressHex, args, sender: accountAddress },
			{ cause: error },
		);
	}
}
