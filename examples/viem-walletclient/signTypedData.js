/**
 * Sign Typed Data
 *
 * Signs EIP-712 typed data.
 *
 * @module signTypedData
 */

import { parseAccount } from "./createWalletClient.js";
import { AccountNotFoundError } from "./errors.js";

/**
 * Get EIP712Domain types based on domain fields present
 *
 * @param {import('./WalletClientTypes.js').EIP712Domain} domain
 * @returns {Array<{ name: string; type: string }>}
 */
function getTypesForEIP712Domain({ domain }) {
	const types = [];
	if (domain?.name) types.push({ name: "name", type: "string" });
	if (domain?.version) types.push({ name: "version", type: "string" });
	if (domain?.chainId !== undefined) types.push({ name: "chainId", type: "uint256" });
	if (domain?.verifyingContract) types.push({ name: "verifyingContract", type: "address" });
	if (domain?.salt) types.push({ name: "salt", type: "bytes32" });
	return types;
}

/**
 * Serialize typed data to JSON string for RPC
 *
 * @param {Object} params
 * @param {import('./WalletClientTypes.js').EIP712Domain} params.domain
 * @param {Record<string, unknown>} params.message
 * @param {string} params.primaryType
 * @param {Record<string, Array<{ name: string; type: string }>>} params.types
 * @returns {string}
 */
function serializeTypedData({ domain, message, primaryType, types }) {
	// Convert bigint values to strings for JSON serialization
	const replacer = (key, value) => {
		if (typeof value === "bigint") {
			return value.toString();
		}
		return value;
	};

	return JSON.stringify(
		{
			domain: domain ?? {},
			message,
			primaryType,
			types,
		},
		replacer,
	);
}

/**
 * Validate typed data structure
 *
 * @param {Object} params
 * @param {import('./WalletClientTypes.js').EIP712Domain} params.domain
 * @param {Record<string, unknown>} params.message
 * @param {string} params.primaryType
 * @param {Record<string, Array<{ name: string; type: string }>>} params.types
 * @throws {Error} If validation fails
 */
function validateTypedData({ domain, message, primaryType, types }) {
	// Ensure primaryType exists in types
	if (!types[primaryType] && primaryType !== "EIP712Domain") {
		throw new Error(`Primary type "${primaryType}" not found in types`);
	}

	// Validate domain fields if present
	if (domain) {
		if (domain.verifyingContract && !isValidAddress(domain.verifyingContract)) {
			throw new Error("Invalid verifyingContract address in domain");
		}
	}

	// Basic message validation
	if (typeof message !== "object" || message === null) {
		throw new Error("Message must be an object");
	}
}

/**
 * Basic address validation
 *
 * @param {string} address
 * @returns {boolean}
 */
function isValidAddress(address) {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Sign typed data using EIP-712 format
 *
 * For local accounts, signs using the account's signTypedData method.
 * For JSON-RPC accounts, calls eth_signTypedData_v4.
 *
 * @param {import('./WalletClientTypes.js').Client} client
 * @param {import('./WalletClientTypes.js').SignTypedDataParameters} parameters
 * @returns {Promise<string>}
 *
 * @example
 * ```javascript
 * import { createWalletClient } from './createWalletClient.js';
 * import { privateKeyToAccount } from '../viem-account/index.js';
 *
 * const account = privateKeyToAccount('0x...');
 * const client = createWalletClient({ account, transport: http() });
 *
 * const signature = await client.signTypedData({
 *   domain: {
 *     name: 'Ether Mail',
 *     version: '1',
 *     chainId: 1n,
 *     verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
 *   },
 *   types: {
 *     Person: [
 *       { name: 'name', type: 'string' },
 *       { name: 'wallet', type: 'address' },
 *     ],
 *     Mail: [
 *       { name: 'from', type: 'Person' },
 *       { name: 'to', type: 'Person' },
 *       { name: 'contents', type: 'string' },
 *     ],
 *   },
 *   primaryType: 'Mail',
 *   message: {
 *     from: { name: 'Alice', wallet: '0x...' },
 *     to: { name: 'Bob', wallet: '0x...' },
 *     contents: 'Hello!',
 *   },
 * });
 * ```
 */
export async function signTypedData(client, parameters) {
	const { account: account_, domain, message, primaryType } = parameters;

	// Get account from parameters or client
	const accountArg = account_ ?? client.account;
	if (!accountArg) {
		throw new AccountNotFoundError({
			docsPath: "/docs/actions/wallet/signTypedData",
		});
	}

	const account = parseAccount(accountArg);

	// Build full types including EIP712Domain
	const types = {
		EIP712Domain: getTypesForEIP712Domain({ domain }),
		...parameters.types,
	};

	// Validate typed data
	validateTypedData({ domain, message, primaryType, types });

	// Local account: sign locally
	if (account.signTypedData) {
		return account.signTypedData({ domain, message, primaryType, types });
	}

	// JSON-RPC: call eth_signTypedData_v4
	const typedData = serializeTypedData({ domain, message, primaryType, types });

	return client.request(
		{
			method: "eth_signTypedData_v4",
			params: [account.address, typedData],
		},
		{ retryCount: 0 },
	);
}

/**
 * Factory: Create signTypedData with custom dependencies
 *
 * @param {Object} deps
 * @param {Function} deps.parseAccount
 * @returns {Function}
 */
export function SignTypedData({ parseAccount: parseAccountFn }) {
	return async function signTypedData(client, parameters) {
		const { account: account_, domain, message, primaryType } = parameters;

		const accountArg = account_ ?? client.account;
		if (!accountArg) {
			throw new AccountNotFoundError({
				docsPath: "/docs/actions/wallet/signTypedData",
			});
		}

		const account = parseAccountFn(accountArg);

		const types = {
			EIP712Domain: getTypesForEIP712Domain({ domain }),
			...parameters.types,
		};

		validateTypedData({ domain, message, primaryType, types });

		if (account.signTypedData) {
			return account.signTypedData({ domain, message, primaryType, types });
		}

		const typedData = serializeTypedData({ domain, message, primaryType, types });

		return client.request(
			{
				method: "eth_signTypedData_v4",
				params: [account.address, typedData],
			},
			{ retryCount: 0 },
		);
	};
}

export default signTypedData;
