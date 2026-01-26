/**
 * @fileoverview Main services module exports for voltaire-effect.
 *
 * @module services
 * @since 0.0.1
 *
 * @description
 * This is the main entry point for all voltaire-effect services. It re-exports
 * all service definitions, implementations, and related types.
 *
 * ## Service Categories
 *
 * ### Transport
 * Low-level JSON-RPC communication with Ethereum nodes.
 * - {@link TransportService} - Service interface
 * - {@link HttpTransport} - HTTP transport layer
 * - {@link WebSocketTransport} - WebSocket transport layer
 * - {@link BrowserTransport} - Browser wallet (window.ethereum) transport
 * - {@link TestTransport} - Mock transport for testing
 *
 * ### Provider
 * Read-only blockchain operations (blocks, transactions, balances).
 * - {@link ProviderService} - Service interface
 * - {@link Provider} - Live implementation layer
 *
 * ### Signer
 * Signing and transaction operations.
 * - {@link SignerService} - Service interface
 * - {@link Signer} - Namespace with Live layer and composition helpers
 *
 * ### Account
 * Cryptographic signing implementations.
 * - {@link AccountService} - Service interface
 * - {@link LocalAccount} - Local private key signing
 * - {@link JsonRpcAccount} - Remote JSON-RPC signing
 *
 * ### Contract
 * Type-safe smart contract interactions.
 * - {@link Contract} - Factory to create contract instances
 *
 * @example Typical usage pattern
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   ProviderService,
 *   Provider,
 *   HttpTransport
 * } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *   return yield* provider.getBlockNumber()
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 *
 * await Effect.runPromise(program)
 * ```
 */

// AbiEncoder exports
export {
	AbiDecodeError,
	AbiEncodeError,
	AbiEncoderService,
	type AbiEncoderShape,
	DefaultAbiEncoder,
} from "./AbiEncoder/index.js";
// Account exports
export {
	AccountError,
	AccountService,
	type AccountShape,
	JsonRpcAccount,
	LocalAccount,
	MnemonicAccount,
	type MnemonicAccountOptions,
	type UnsignedTransaction,
} from "./Account/index.js";
// Formatter exports
export {
	DefaultFormatter,
	FormatError,
	FormatterService,
	type FormatterShape,
} from "./Formatter/index.js";
// Contract exports
export {
	type Abi as ContractAbi,
	type AbiItem as ContractAbiItem,
	type BlockTag as ContractBlockTag,
	Contract,
	ContractCallError,
	ContractError,
	ContractEventError,
	type ContractInstance,
	ContractWriteError,
	type DecodedEvent,
	type EventFilter,
} from "./Contract/index.js";
// Provider exports
export {
	type AccessListType,
	type BlockTag as ProviderBlockTag,
	type BlockType,
	type CallRequest,
	type FeeHistoryType,
	type LogFilter as ProviderLogFilter,
	type LogType,
	Provider,
	ProviderError,
	ProviderService,
	type ProviderShape,
	type ReceiptType,
	type TransactionType,
} from "./Provider/index.js";
// Preset exports (layer composition helpers)
export {
	ArbitrumProvider,
	BaseProvider,
	type ComposedServices,
	createProvider,
	MainnetFullProvider,
	MainnetProvider,
	OptimismProvider,
	PolygonProvider,
	SepoliaProvider,
} from "./presets/index.js";
// Transport exports
export {
	BrowserTransport,
	HttpTransport,
	TestTransport,
	TransportError,
	TransportService,
	type TransportShape,
	WebSocketTransport,
} from "./Transport/index.js";
// Signer exports
export {
	Signer,
	SignerError,
	SignerService,
	type SignerShape,
	type TransactionRequest,
} from "./Signer/index.js";
// NonceManager exports
export {
	DefaultNonceManager,
	NonceError,
	NonceManagerService,
	type NonceManagerShape,
} from "./NonceManager/index.js";
// Cache exports
export {
	CacheService,
	type CacheShape,
	MemoryCache,
	type MemoryCacheOptions,
	NoopCache,
} from "./Cache/index.js";
// TransactionSerializer exports
export {
	DefaultTransactionSerializer,
	DeserializeError,
	SerializeError,
	TransactionSerializerService,
} from "./TransactionSerializer/index.js";
// Chain exports
export {
	arbitrum,
	arbitrumConfig,
	base,
	baseConfig,
	type ChainConfig,
	type ChainContract,
	ChainService,
	mainnet,
	mainnetConfig,
	optimism,
	optimismConfig,
	polygon,
	polygonConfig,
	sepolia,
	sepoliaConfig,
} from "./Chain/index.js";
// FeeEstimator exports
export {
	DefaultFeeEstimator,
	FeeEstimationError,
	FeeEstimatorService,
	type FeeEstimatorShape,
	type FeeValues,
	type FeeValuesEIP1559,
	type FeeValuesLegacy,
	makeFeeEstimator,
} from "./FeeEstimator/index.js";
// Multicall exports
export {
	DefaultMulticall,
	type MulticallCall,
	MulticallError,
	type MulticallResult,
	MulticallService,
	type MulticallShape,
} from "./Multicall/index.js";
// BlockStream exports
export {
	BlockStream,
	BlockStreamError,
	BlockStreamService,
	type BlockStreamShape,
} from "./BlockStream/index.js";
// Kzg exports
export {
	DefaultKzg,
	KzgError,
	KzgService,
	type KzgShape,
	NoopKzg,
} from "./Kzg/index.js";
// Ccip exports
export {
	CcipError,
	type CcipRequest,
	CcipService,
	type CcipShape,
	DefaultCcip,
	NoopCcip,
} from "./Ccip/index.js";
// RpcBatch exports
export {
	EthBlockNumber,
	EthCall,
	EthChainId,
	EthEstimateGas,
	EthGasPrice,
	EthGetBalance,
	EthGetBlockByHash,
	EthGetBlockByNumber,
	EthGetCode,
	EthGetLogs,
	EthGetStorageAt,
	EthGetTransactionByHash,
	EthGetTransactionCount,
	EthGetTransactionReceipt,
	GenericRpcRequest,
	makeRpcResolver,
	RpcBatch,
	RpcBatchService,
	type RpcBatchShape,
	type RpcRequest,
} from "./RpcBatch/index.js";
// Blockchain exports
export {
	type Block,
	BlockchainError,
	BlockchainService,
	type BlockchainShape,
	ForkBlockchain,
	type ForkBlockchainOptions,
	type HexInput as BlockchainHexInput,
	InMemoryBlockchain,
} from "../blockchain/index.js";
// RawProvider exports
export {
	RawProviderService,
	type RawProviderShape,
	RawProviderTransport,
	type RequestArguments as RawRequestArguments,
} from "./RawProvider/index.js";
// TransactionStream exports
export {
	TransactionStream,
	TransactionStreamError,
	TransactionStreamService,
	type TransactionStreamShape,
} from "../transaction/index.js";
// RateLimiter exports
export {
	DefaultRateLimiter,
	makeRateLimiter,
	NoopRateLimiter,
	RateLimitError,
	type RateLimitBehavior,
	type RateLimiterConfig,
	RateLimiterService,
	type RateLimiterShape,
} from "./RateLimiter/index.js";
