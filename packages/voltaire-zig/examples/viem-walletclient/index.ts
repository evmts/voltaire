/**
 * Viem-compatible WalletClient for Voltaire
 *
 * Drop-in replacement for viem's WalletClient using Voltaire primitives.
 *
 * @module viem-walletclient
 *
 * @example
 * ```typescript
 * import { createWalletClient, http, custom } from './examples/viem-walletclient/index.js';
 * import { privateKeyToAccount } from './examples/viem-account/index.js';
 *
 * // With local account (signing locally)
 * const account = privateKeyToAccount('0x...');
 * const client = createWalletClient({
 *   account,
 *   chain: mainnet,
 *   transport: http('https://mainnet.infura.io/v3/...'),
 * });
 *
 * // Sign and send transaction
 * const hash = await client.sendTransaction({
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * });
 *
 * // Sign message
 * const signature = await client.signMessage({
 *   message: 'Hello, Ethereum!',
 * });
 *
 * // With JSON-RPC account (wallet signs)
 * const browserClient = createWalletClient({
 *   transport: custom(window.ethereum),
 * });
 *
 * const addresses = await browserClient.requestAddresses();
 * ```
 */

// Main factory
export {
	createWalletClient,
	parseAccount,
	CreateWalletClient,
} from "./createWalletClient.js";

// Wallet actions
export { getAddresses, GetAddresses } from "./getAddresses.js";
export { requestAddresses, RequestAddresses } from "./requestAddresses.js";
export { sendTransaction, SendTransaction } from "./sendTransaction.js";
export { signMessage, SignMessage } from "./signMessage.js";
export { signTransaction, SignTransaction } from "./signTransaction.js";
export { signTypedData, SignTypedData } from "./signTypedData.js";
export { getChainId, GetChainId } from "./getChainId.js";
export {
	prepareTransactionRequest,
	PrepareTransactionRequest,
	defaultParameters,
} from "./prepareTransactionRequest.js";
export {
	sendRawTransaction,
	SendRawTransaction,
} from "./sendRawTransaction.js";

// Transports
export { http, custom, fallback } from "./transports.js";

// Errors
export {
	WalletClientError,
	AccountNotFoundError,
	AccountTypeNotSupportedError,
	ChainMismatchError,
	InvalidTransactionError,
	FeeEstimationError,
	TransportError,
	UserRejectedRequestError,
	WalletNotConnectedError,
	TransactionExecutionError,
} from "./errors.js";

// Types
export type {
	// Core types
	WalletClient,
	Client,
	CreateWalletClientParameters,
	WalletActions,
	Chain,
	Transport,
	TransportConfig,
	RequestFn,
	RequestOptions,
	ExtendFn,
	// Transaction types
	TransactionRequest,
	TransactionRequestLegacy,
	TransactionRequestEIP2930,
	TransactionRequestEIP1559,
	TransactionRequestEIP4844,
	TransactionRequestEIP7702,
	TransactionType,
	AccessList,
	AccessListEntry,
	Authorization,
	// Action parameters
	SendTransactionParameters,
	SignMessageParameters,
	SignTransactionParameters,
	SignTypedDataParameters,
	// Primitive types
	Address,
	Hash,
	Hex,
	// Account types (re-exported)
	Account,
	LocalAccount,
	JsonRpcAccount,
	PrivateKeyAccount,
	NonceManager,
	// Typed data types
	EIP712Domain,
	TypeProperty,
	TypedDataDefinition,
	SignatureComponents,
	SerializeTransactionFn,
} from "./WalletClientTypes.js";
