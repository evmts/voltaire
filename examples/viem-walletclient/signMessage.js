/**
 * Sign Message
 *
 * Signs a message using EIP-191 personal_sign format.
 *
 * @module signMessage
 */

import { parseAccount } from "./createWalletClient.js";
import { AccountNotFoundError } from "./errors.js";

/**
 * Convert bytes to hex string
 *
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function toHex(bytes) {
	return `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Convert string to hex
 *
 * @param {string} str
 * @returns {string}
 */
function stringToHex(str) {
	return toHex(new TextEncoder().encode(str));
}

/**
 * Sign a message using EIP-191 format
 *
 * For local accounts, signs the message locally using the account's
 * signMessage method. For JSON-RPC accounts, calls personal_sign.
 *
 * @param {import('./WalletClientTypes.js').Client} client
 * @param {import('./WalletClientTypes.js').SignMessageParameters} parameters
 * @returns {Promise<string>}
 *
 * @example
 * ```javascript
 * import { createWalletClient } from './createWalletClient.js';
 * import { privateKeyToAccount } from '../viem-account/index.js';
 *
 * // Local account - signs locally
 * const account = privateKeyToAccount('0x...');
 * const client = createWalletClient({ account, transport: http() });
 *
 * const signature = await client.signMessage({
 *   message: 'Hello, Ethereum!',
 * });
 *
 * // JSON-RPC account - calls personal_sign
 * const client2 = createWalletClient({ transport: custom(window.ethereum) });
 * const signature2 = await client2.signMessage({
 *   account: '0x...',
 *   message: 'Hello, Ethereum!',
 * });
 * ```
 *
 * @example
 * ```javascript
 * // Sign raw bytes
 * const signature = await client.signMessage({
 *   message: { raw: new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]) },
 * });
 *
 * // Sign raw hex
 * const signature2 = await client.signMessage({
 *   message: { raw: '0x48656c6c6f' },
 * });
 * ```
 */
export async function signMessage(client, { account: account_, message }) {
	// Get account from parameters or client
	const accountArg = account_ ?? client.account;
	if (!accountArg) {
		throw new AccountNotFoundError({
			docsPath: "/docs/actions/wallet/signMessage",
		});
	}

	const account = parseAccount(accountArg);

	// Local account: sign locally
	if (account.signMessage) {
		return account.signMessage({ message });
	}

	// JSON-RPC: format message and call personal_sign
	const message_ = formatMessage(message);

	return client.request(
		{
			method: "personal_sign",
			params: [message_, account.address],
		},
		{ retryCount: 0 },
	);
}

/**
 * Format message for personal_sign RPC call
 *
 * @param {string | { raw: string | Uint8Array }} message
 * @returns {string}
 */
function formatMessage(message) {
	if (typeof message === "string") {
		return stringToHex(message);
	}
	if (message.raw instanceof Uint8Array) {
		return toHex(message.raw);
	}
	return message.raw;
}

/**
 * Factory: Create signMessage with custom dependencies
 *
 * @param {Object} deps
 * @param {Function} deps.parseAccount
 * @returns {Function}
 */
export function SignMessage({ parseAccount: parseAccountFn }) {
	return async function signMessage(client, { account: account_, message }) {
		const accountArg = account_ ?? client.account;
		if (!accountArg) {
			throw new AccountNotFoundError({
				docsPath: "/docs/actions/wallet/signMessage",
			});
		}

		const account = parseAccountFn(accountArg);

		if (account.signMessage) {
			return account.signMessage({ message });
		}

		const message_ = formatMessage(message);

		return client.request(
			{
				method: "personal_sign",
				params: [message_, account.address],
			},
			{ retryCount: 0 },
		);
	};
}

export default signMessage;
