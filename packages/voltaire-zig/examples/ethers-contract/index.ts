/**
 * Ethers-style Contract - Copyable Playbook
 *
 * Reference implementation following ethers v6 Contract patterns.
 * Copy this entire directory into your codebase and customize as needed.
 *
 * @module examples/ethers-contract
 *
 * @example
 * ```typescript
 * import { EthersContract, ContractFactory } from './ethers-contract';
 *
 * // Create contract instance
 * const usdc = EthersContract({
 *   target: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *   abi: erc20Abi,
 *   runner: provider
 * });
 *
 * // Call methods (ethers v6 style)
 * const balance = await usdc.balanceOf(address);  // view -> staticCall
 * const tx = await usdc.transfer(to, amount);     // write -> send
 *
 * // Explicit method variants
 * await usdc.transfer.staticCall(to, amount);     // simulate
 * await usdc.transfer.estimateGas(to, amount);    // gas estimation
 * await usdc.transfer.populateTransaction(to, amount); // build tx
 *
 * // Event filters
 * const logs = await usdc.queryFilter(usdc.filters.Transfer());
 *
 * // Deploy new contract
 * const factory = ContractFactory({
 *   abi: myTokenAbi,
 *   bytecode: myTokenBytecode,
 *   runner: signer
 * });
 * const deployed = await factory.deploy('MyToken', 'MTK');
 * await deployed.waitForDeployment();
 * ```
 */

// Main contract factory
export { EthersContract } from "./EthersContract.js";

// Contract factory for deployment
export { ContractFactory } from "./ContractFactory.js";

// Error classes
export {
	ContractError,
	UnsupportedOperationError,
	CallExceptionError,
	InvalidArgumentError,
	FunctionNotFoundError,
	EventNotFoundError,
	AmbiguousMatchError,
	UnconfiguredNameError,
	PanicReasons,
	decodeRevertReason,
} from "./errors.js";

// Types
export type {
	// Runner types
	ProviderLike,
	SignerLike,
	ContractRunner,
	// Transaction types
	ContractTransactionRequest,
	ContractTransactionResponse,
	ContractTransactionReceipt,
	// Event types
	DecodedEventLog,
	EventFilter,
	PreparedTopicFilter,
	ContractEventListener,
	// Method types
	WrappedContractMethod,
	WrappedContractEvent,
	// Contract instance types
	EthersContract as EthersContractType,
	ContractFilters,
	ContractMethods,
	ContractReadMethods,
	ContractWriteMethods,
	// Factory types
	ContractFactoryInterface,
	// Options
	EthersContractOptions,
	ContractFactoryOptions,
	// ABI extraction helpers
	ExtractReadFunctions,
	ExtractWriteFunctions,
	ExtractFunctions,
	ExtractEvents,
	GetFunction,
	GetEvent,
} from "./EthersContractTypes.js";
