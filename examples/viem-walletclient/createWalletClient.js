/**
 * Create Wallet Client
 *
 * Factory function that creates a viem-compatible WalletClient.
 *
 * @module createWalletClient
 */

import { getAddresses } from "./getAddresses.js";
import { requestAddresses } from "./requestAddresses.js";
import { sendTransaction } from "./sendTransaction.js";
import { signMessage } from "./signMessage.js";
import { signTransaction } from "./signTransaction.js";
import { signTypedData } from "./signTypedData.js";
import { getChainId } from "./getChainId.js";
import { prepareTransactionRequest } from "./prepareTransactionRequest.js";
import { sendRawTransaction } from "./sendRawTransaction.js";

/**
 * Generate a unique identifier
 *
 * @returns {string}
 */
function uid() {
	return Math.random().toString(36).slice(2, 11);
}

/**
 * Parse account - convert string address to JSON-RPC account
 *
 * @param {string | import('./WalletClientTypes.js').Account} account
 * @returns {import('./WalletClientTypes.js').Account}
 */
export function parseAccount(account) {
	if (typeof account === "string") {
		return { address: account, type: "json-rpc" };
	}
	return account;
}

/**
 * Create wallet actions decorator
 *
 * @param {import('./WalletClientTypes.js').Client} client
 * @returns {import('./WalletClientTypes.js').WalletActions}
 */
function walletActions(client) {
	return {
		getAddresses: () => getAddresses(client),
		requestAddresses: () => requestAddresses(client),
		sendTransaction: (args) => sendTransaction(client, args),
		signMessage: (args) => signMessage(client, args),
		signTransaction: (args) => signTransaction(client, args),
		signTypedData: (args) => signTypedData(client, args),
		getChainId: () => getChainId(client),
		prepareTransactionRequest: (args) => prepareTransactionRequest(client, args),
		sendRawTransaction: (args) => sendRawTransaction(client, args),
	};
}

/**
 * Create a viem-compatible WalletClient
 *
 * WalletClient provides wallet actions like sending transactions,
 * signing messages, and managing accounts.
 *
 * @param {import('./WalletClientTypes.js').CreateWalletClientParameters} parameters
 * @returns {import('./WalletClientTypes.js').WalletClient}
 *
 * @example
 * ```javascript
 * import { createWalletClient } from './createWalletClient.js';
 * import { http } from './transports.js';
 *
 * // With JSON-RPC account (signing via wallet)
 * const client = createWalletClient({
 *   transport: http('https://mainnet.infura.io/v3/...'),
 * });
 *
 * // Request wallet connection
 * const addresses = await client.requestAddresses();
 *
 * // Send transaction (signed by wallet)
 * const hash = await client.sendTransaction({
 *   account: addresses[0],
 *   to: '0x...',
 *   value: 1000000000000000000n,
 * });
 * ```
 *
 * @example
 * ```javascript
 * import { createWalletClient } from './createWalletClient.js';
 * import { privateKeyToAccount } from '../viem-account/index.js';
 * import { http } from './transports.js';
 *
 * // With local account (signing locally)
 * const account = privateKeyToAccount('0x...');
 * const client = createWalletClient({
 *   account,
 *   chain: mainnet,
 *   transport: http('https://mainnet.infura.io/v3/...'),
 * });
 *
 * // Account is hoisted - no need to specify per action
 * const hash = await client.sendTransaction({
 *   to: '0x...',
 *   value: 1000000000000000000n,
 * });
 * ```
 */
export function createWalletClient(parameters) {
	const {
		account: account_,
		chain,
		transport,
		key = "wallet",
		name = "Wallet Client",
		pollingInterval: pollingInterval_,
		cacheTime: cacheTime_,
	} = parameters;

	// Parse account if provided
	const account = account_ ? parseAccount(account_) : undefined;

	// Calculate polling interval based on chain block time
	const blockTime = chain?.blockTime ?? 12_000;
	const defaultPollingInterval = Math.min(Math.max(Math.floor(blockTime / 2), 500), 4_000);
	const pollingInterval = pollingInterval_ ?? defaultPollingInterval;
	const cacheTime = cacheTime_ ?? pollingInterval;

	// Initialize transport
	const { config, request, value } = transport({
		chain,
		pollingInterval,
	});
	const transportConfig = { ...config, ...value };

	// Create base client
	const clientUid = uid();
	const client = {
		account,
		chain,
		key,
		name,
		type: "walletClient",
		uid: clientUid,
		pollingInterval,
		cacheTime,
		request,
		transport: transportConfig,
	};

	/**
	 * Create extend function for client
	 *
	 * @param {object} base - Base client to extend
	 * @returns {function} Extension function
	 */
	function extend(base) {
		return (extendFn) => {
			const extended = extendFn(base);
			// Remove base client properties from extended object
			for (const prop in client) {
				delete extended[prop];
			}
			const combined = { ...base, ...extended };
			return Object.assign(combined, { extend: extend(combined) });
		};
	}

	// Add wallet actions and extend capability
	const actions = walletActions(client);
	return Object.assign(client, actions, { extend: extend({ ...client, ...actions }) });
}

/**
 * Factory: Create createWalletClient with custom dependencies
 *
 * Allows injecting custom implementations for testing or customization.
 *
 * @param {Object} deps
 * @param {Function} deps.walletActions - Custom wallet actions decorator
 * @returns {Function} createWalletClient function
 */
export function CreateWalletClient({ walletActions: customWalletActions }) {
	return function createWalletClient(parameters) {
		const {
			account: account_,
			chain,
			transport,
			key = "wallet",
			name = "Wallet Client",
			pollingInterval: pollingInterval_,
			cacheTime: cacheTime_,
		} = parameters;

		const account = account_ ? parseAccount(account_) : undefined;
		const blockTime = chain?.blockTime ?? 12_000;
		const defaultPollingInterval = Math.min(Math.max(Math.floor(blockTime / 2), 500), 4_000);
		const pollingInterval = pollingInterval_ ?? defaultPollingInterval;
		const cacheTime = cacheTime_ ?? pollingInterval;

		const { config, request, value } = transport({ chain, pollingInterval });
		const transportConfig = { ...config, ...value };

		const clientUid = uid();
		const client = {
			account,
			chain,
			key,
			name,
			type: "walletClient",
			uid: clientUid,
			pollingInterval,
			cacheTime,
			request,
			transport: transportConfig,
		};

		function extend(base) {
			return (extendFn) => {
				const extended = extendFn(base);
				for (const prop in client) delete extended[prop];
				const combined = { ...base, ...extended };
				return Object.assign(combined, { extend: extend(combined) });
			};
		}

		const actions = customWalletActions(client);
		return Object.assign(client, actions, { extend: extend({ ...client, ...actions }) });
	};
}

export default createWalletClient;
