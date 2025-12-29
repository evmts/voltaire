/**
 * Send Transaction
 *
 * Creates, signs, and sends a transaction to the network.
 *
 * @module sendTransaction
 */

import { parseAccount } from "./createWalletClient.js";
import {
	AccountNotFoundError,
	AccountTypeNotSupportedError,
	ChainMismatchError,
	TransactionExecutionError,
} from "./errors.js";
import { getChainId } from "./getChainId.js";
import { prepareTransactionRequest } from "./prepareTransactionRequest.js";
import { sendRawTransaction } from "./sendRawTransaction.js";

/**
 * Convert number to hex string
 *
 * @param {number | bigint} value
 * @returns {string}
 */
function numberToHex(value) {
	return `0x${value.toString(16)}`;
}

/**
 * Format transaction request for JSON-RPC
 *
 * @param {import('./WalletClientTypes.js').TransactionRequest} transaction
 * @param {number} [chainId]
 * @returns {Object}
 */
function formatTransactionRequest(transaction, chainId) {
	const request = {};

	if (transaction.from) request.from = transaction.from;
	if (transaction.to) request.to = transaction.to;
	if (transaction.to === null) request.to = undefined; // Contract deployment
	if (transaction.data) request.data = transaction.data;
	if (transaction.value !== undefined) request.value = numberToHex(transaction.value);
	if (transaction.gas !== undefined) request.gas = numberToHex(transaction.gas);
	if (transaction.nonce !== undefined) request.nonce = numberToHex(transaction.nonce);
	if (chainId !== undefined) request.chainId = numberToHex(chainId);

	// Type-specific fields
	if (transaction.gasPrice !== undefined) {
		request.gasPrice = numberToHex(transaction.gasPrice);
	}
	if (transaction.maxFeePerGas !== undefined) {
		request.maxFeePerGas = numberToHex(transaction.maxFeePerGas);
	}
	if (transaction.maxPriorityFeePerGas !== undefined) {
		request.maxPriorityFeePerGas = numberToHex(transaction.maxPriorityFeePerGas);
	}
	if (transaction.maxFeePerBlobGas !== undefined) {
		request.maxFeePerBlobGas = numberToHex(transaction.maxFeePerBlobGas);
	}
	if (transaction.accessList) {
		request.accessList = transaction.accessList;
	}

	return request;
}

/**
 * Assert current chain matches expected chain
 *
 * @param {Object} params
 * @param {number} params.currentChainId
 * @param {import('./WalletClientTypes.js').Chain} params.chain
 * @throws {ChainMismatchError}
 */
function assertCurrentChain({ currentChainId, chain }) {
	if (chain && chain.id !== currentChainId) {
		throw new ChainMismatchError({
			currentChainId,
			expectedChainId: chain.id,
		});
	}
}

/**
 * Wrap transaction errors with context
 *
 * @param {Error} err
 * @param {Object} context
 * @returns {Error}
 */
function getTransactionError(err, context) {
	if (err instanceof AccountTypeNotSupportedError) {
		return err;
	}
	return new TransactionExecutionError(err.message, {
		transaction: context,
		cause: err,
	});
}

/**
 * Send a transaction
 *
 * For JSON-RPC accounts, sends via eth_sendTransaction (wallet signs).
 * For local accounts, signs locally and sends via eth_sendRawTransaction.
 *
 * @param {import('./WalletClientTypes.js').Client} client
 * @param {import('./WalletClientTypes.js').SendTransactionParameters} parameters
 * @returns {Promise<string>} Transaction hash
 *
 * @example
 * ```javascript
 * import { createWalletClient, custom } from './index.js';
 *
 * // JSON-RPC account - wallet signs
 * const client = createWalletClient({
 *   transport: custom(window.ethereum),
 * });
 *
 * const hash = await client.sendTransaction({
 *   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * });
 * ```
 *
 * @example
 * ```javascript
 * import { createWalletClient, http } from './index.js';
 * import { privateKeyToAccount } from '../viem-account/index.js';
 *
 * // Local account - signs locally, sends raw
 * const account = privateKeyToAccount('0x...');
 * const client = createWalletClient({
 *   account,
 *   chain: mainnet,
 *   transport: http('https://mainnet.infura.io/v3/...'),
 * });
 *
 * const hash = await client.sendTransaction({
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * });
 * ```
 */
export async function sendTransaction(client, parameters) {
	const {
		account: account_ = client.account,
		chain = client.chain,
		accessList,
		authorizationList,
		blobs,
		data,
		gas,
		gasPrice,
		maxFeePerBlobGas,
		maxFeePerGas,
		maxPriorityFeePerGas,
		nonce,
		type,
		value,
		...rest
	} = parameters;

	// Require account
	if (typeof account_ === "undefined") {
		throw new AccountNotFoundError({
			docsPath: "/docs/actions/wallet/sendTransaction",
		});
	}

	const account = account_ ? parseAccount(account_) : null;

	try {
		// Resolve `to` address
		const to = await (async () => {
			if (parameters.to) return parameters.to;
			if (parameters.to === null) return undefined; // Contract deployment
			// For EIP-7702, could recover from authorizationList - simplified here
			return undefined;
		})();

		// JSON-RPC account: use eth_sendTransaction
		if (account?.type === "json-rpc" || account === null) {
			let chainId;
			if (chain !== null) {
				chainId = await getChainId(client);
				assertCurrentChain({ currentChainId: chainId, chain });
			}

			const request = formatTransactionRequest(
				{
					...rest,
					from: account?.address,
					accessList,
					authorizationList,
					blobs,
					data,
					gas,
					gasPrice,
					maxFeePerBlobGas,
					maxFeePerGas,
					maxPriorityFeePerGas,
					nonce,
					to,
					type,
					value,
				},
				chainId,
			);

			return client.request(
				{
					method: "eth_sendTransaction",
					params: [request],
				},
				{ retryCount: 0 },
			);
		}

		// Local account: prepare, sign, and send raw
		if (account?.type === "local") {
			// Prepare transaction (estimate gas, get nonce, etc.)
			const request = await prepareTransactionRequest(client, {
				account,
				accessList,
				authorizationList,
				blobs,
				chain,
				data,
				gas,
				gasPrice,
				maxFeePerBlobGas,
				maxFeePerGas,
				maxPriorityFeePerGas,
				nonce,
				type,
				value,
				...rest,
				to,
			});

			// Sign transaction locally
			const serializer = chain?.serializers?.transaction;
			const serializedTransaction = await account.signTransaction(request, {
				serializer,
			});

			// Send raw transaction
			return sendRawTransaction(client, { serializedTransaction });
		}

		// Smart accounts not supported directly
		if (account?.type === "smart") {
			throw new AccountTypeNotSupportedError({
				metaMessages: ["Consider using the `sendUserOperation` Action instead."],
				docsPath: "/docs/actions/bundler/sendUserOperation",
				type: "smart",
			});
		}

		throw new AccountTypeNotSupportedError({
			docsPath: "/docs/actions/wallet/sendTransaction",
			type: account?.type,
		});
	} catch (err) {
		if (err instanceof AccountTypeNotSupportedError) throw err;
		throw getTransactionError(err, {
			...parameters,
			account,
			chain: parameters.chain || undefined,
		});
	}
}

/**
 * Factory: Create sendTransaction with custom dependencies
 *
 * @param {Object} deps
 * @param {Function} deps.parseAccount
 * @param {Function} deps.getChainId
 * @param {Function} deps.prepareTransactionRequest
 * @param {Function} deps.sendRawTransaction
 * @returns {Function}
 */
export function SendTransaction({
	parseAccount: parseAccountFn,
	getChainId: getChainIdFn,
	prepareTransactionRequest: prepareTransactionRequestFn,
	sendRawTransaction: sendRawTransactionFn,
}) {
	return async function sendTransaction(client, parameters) {
		const {
			account: account_ = client.account,
			chain = client.chain,
			accessList,
			authorizationList,
			blobs,
			data,
			gas,
			gasPrice,
			maxFeePerBlobGas,
			maxFeePerGas,
			maxPriorityFeePerGas,
			nonce,
			type,
			value,
			...rest
		} = parameters;

		if (typeof account_ === "undefined") {
			throw new AccountNotFoundError({
				docsPath: "/docs/actions/wallet/sendTransaction",
			});
		}

		const account = account_ ? parseAccountFn(account_) : null;

		try {
			const to = parameters.to ?? (parameters.to === null ? undefined : undefined);

			if (account?.type === "json-rpc" || account === null) {
				let chainId;
				if (chain !== null) {
					chainId = await getChainIdFn(client);
					assertCurrentChain({ currentChainId: chainId, chain });
				}

				const request = formatTransactionRequest(
					{
						...rest,
						from: account?.address,
						accessList,
						authorizationList,
						blobs,
						data,
						gas,
						gasPrice,
						maxFeePerBlobGas,
						maxFeePerGas,
						maxPriorityFeePerGas,
						nonce,
						to,
						type,
						value,
					},
					chainId,
				);

				return client.request(
					{ method: "eth_sendTransaction", params: [request] },
					{ retryCount: 0 },
				);
			}

			if (account?.type === "local") {
				const request = await prepareTransactionRequestFn(client, {
					account,
					accessList,
					authorizationList,
					blobs,
					chain,
					data,
					gas,
					gasPrice,
					maxFeePerBlobGas,
					maxFeePerGas,
					maxPriorityFeePerGas,
					nonce,
					type,
					value,
					...rest,
					to,
				});

				const serializer = chain?.serializers?.transaction;
				const serializedTransaction = await account.signTransaction(request, { serializer });

				return sendRawTransactionFn(client, { serializedTransaction });
			}

			throw new AccountTypeNotSupportedError({
				docsPath: "/docs/actions/wallet/sendTransaction",
				type: account?.type,
			});
		} catch (err) {
			if (err instanceof AccountTypeNotSupportedError) throw err;
			throw getTransactionError(err, { ...parameters, account, chain });
		}
	};
}

export default sendTransaction;
