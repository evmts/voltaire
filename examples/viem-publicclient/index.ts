/**
 * Viem-style PublicClient
 *
 * A viem-compatible PublicClient implementation using Voltaire primitives.
 *
 * @module examples/viem-publicclient
 *
 * @example
 * ```typescript
 * import { createPublicClient, http, mainnet } from './index.js';
 *
 * const client = createPublicClient({
 *   chain: mainnet,
 *   transport: http('https://eth.example.com')
 * });
 *
 * // Get block number
 * const blockNumber = await client.getBlockNumber();
 *
 * // Get balance
 * const balance = await client.getBalance({
 *   address: '0x...'
 * });
 *
 * // Extend with custom actions
 * const extendedClient = client.extend((base) => ({
 *   async customAction() {
 *     return base.getBlockNumber();
 *   }
 * }));
 * ```
 */

// Client factories
export { createClient } from "./createClient.js";
export { createPublicClient } from "./createPublicClient.js";

// Transport
export { createTransport } from "./createTransport.js";
export { http } from "./http.js";

// Actions decorator
export { publicActions } from "./publicActions.js";

// Individual actions
export {
	getBlockNumber,
	getBalance,
	getChainId,
	call,
	getBlock,
	estimateGas,
	getTransaction,
	getTransactionReceipt,
	getLogs,
	getCode,
	getStorageAt,
	getTransactionCount,
	getGasPrice,
	simulateContract,
} from "./actions/index.js";

// Chain definitions
export {
	mainnet,
	sepolia,
	optimism,
	arbitrum,
	polygon,
	base,
} from "./chains.js";

// Errors
export {
	PublicClientError,
	UrlRequiredError,
	TransactionNotFoundError,
	BlockNotFoundError,
	RpcRequestError,
	ContractRevertError,
	InsufficientFundsError,
	TimeoutError,
} from "./errors.js";

// Types
export type {
	// Block types
	BlockTag,
	BlockIdentifier,
	// Chain types
	Chain,
	// Transport types
	TransportConfig,
	TransportValue,
	Transport,
	TransportFactory,
	// Request types
	RequestFn,
	RequestOptions,
	// Client types
	ClientConfig,
	PublicClientConfig,
	Client,
	// Action parameter types
	GetBlockNumberParameters,
	GetBalanceParameters,
	GetBlockParameters,
	CallParameters,
	EstimateGasParameters,
	SimulateContractParameters,
	SimulateContractReturnType,
	GetTransactionParameters,
	GetTransactionReceiptParameters,
	GetLogsParameters,
	GetCodeParameters,
	GetStorageAtParameters,
	GetTransactionCountParameters,
	// Return types
	Block,
	Transaction,
	TransactionReceipt,
	Log,
	AccessListItem,
	Withdrawal,
	CallResult,
	StateOverride,
	BlockOverrides,
	// Public client types
	PublicActions,
	PublicClient,
} from "./PublicClientType.js";
