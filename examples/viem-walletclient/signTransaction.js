/**
 * Sign Transaction
 *
 * Signs a transaction without broadcasting it.
 *
 * @module signTransaction
 */

import { parseAccount } from "./createWalletClient.js";
import { AccountNotFoundError, ChainMismatchError } from "./errors.js";
import { getChainId } from "./getChainId.js";

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
 * @param {import('./WalletClientTypes.js').Account} account
 * @returns {Object}
 */
function formatTransactionRequest(transaction, account) {
	const request = {};

	if (account?.address) request.from = account.address;
	if (transaction.to) request.to = transaction.to;
	if (transaction.data) request.data = transaction.data;
	if (transaction.value !== undefined) request.value = numberToHex(transaction.value);
	if (transaction.gas !== undefined) request.gas = numberToHex(transaction.gas);
	if (transaction.nonce !== undefined) request.nonce = numberToHex(transaction.nonce);

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
 * Sign a transaction
 *
 * For local accounts, signs using the account's signTransaction method.
 * For JSON-RPC accounts, calls eth_signTransaction.
 *
 * @param {import('./WalletClientTypes.js').Client} client
 * @param {import('./WalletClientTypes.js').SignTransactionParameters} parameters
 * @returns {Promise<string>}
 *
 * @example
 * ```javascript
 * import { createWalletClient } from './createWalletClient.js';
 * import { privateKeyToAccount } from '../viem-account/index.js';
 *
 * const account = privateKeyToAccount('0x...');
 * const client = createWalletClient({
 *   account,
 *   chain: mainnet,
 *   transport: http(),
 * });
 *
 * const signedTx = await client.signTransaction({
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * });
 * ```
 */
export async function signTransaction(client, parameters) {
	const { account: account_, chain = client.chain, ...transaction } = parameters;

	// Get account from parameters or client
	const accountArg = account_ ?? client.account;
	if (!accountArg) {
		throw new AccountNotFoundError({
			docsPath: "/docs/actions/wallet/signTransaction",
		});
	}

	const account = parseAccount(accountArg);

	// Get current chain ID and validate
	const chainId = await getChainId(client);
	if (chain !== null) {
		assertCurrentChain({ currentChainId: chainId, chain });
	}

	// Get chain formatters
	const formatters = chain?.formatters || client.chain?.formatters;
	const format = formatters?.transactionRequest?.format || formatTransactionRequest;

	// Local account: sign locally
	if (account.signTransaction) {
		return account.signTransaction(
			{ ...transaction, chainId },
			{ serializer: client.chain?.serializers?.transaction },
		);
	}

	// JSON-RPC: call eth_signTransaction
	const request = format(transaction, account);

	return client.request(
		{
			method: "eth_signTransaction",
			params: [
				{
					...request,
					chainId: numberToHex(chainId),
					from: account.address,
				},
			],
		},
		{ retryCount: 0 },
	);
}

/**
 * Factory: Create signTransaction with custom dependencies
 *
 * @param {Object} deps
 * @param {Function} deps.parseAccount
 * @param {Function} deps.getChainId
 * @returns {Function}
 */
export function SignTransaction({ parseAccount: parseAccountFn, getChainId: getChainIdFn }) {
	return async function signTransaction(client, parameters) {
		const { account: account_, chain = client.chain, ...transaction } = parameters;

		const accountArg = account_ ?? client.account;
		if (!accountArg) {
			throw new AccountNotFoundError({
				docsPath: "/docs/actions/wallet/signTransaction",
			});
		}

		const account = parseAccountFn(accountArg);

		const chainId = await getChainIdFn(client);
		if (chain !== null) {
			assertCurrentChain({ currentChainId: chainId, chain });
		}

		const formatters = chain?.formatters || client.chain?.formatters;
		const format = formatters?.transactionRequest?.format || formatTransactionRequest;

		if (account.signTransaction) {
			return account.signTransaction(
				{ ...transaction, chainId },
				{ serializer: client.chain?.serializers?.transaction },
			);
		}

		const request = format(transaction, account);

		return client.request(
			{
				method: "eth_signTransaction",
				params: [
					{
						...request,
						chainId: numberToHex(chainId),
						from: account.address,
					},
				],
			},
			{ retryCount: 0 },
		);
	};
}

export default signTransaction;
