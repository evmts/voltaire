/**
 * Ethers Interface Abstraction for Voltaire
 *
 * Provides ethers v6 compatible Interface class using Voltaire ABI primitives.
 *
 * @example
 * ```typescript
 * import { Interface } from './examples/ethers-interface/index.js';
 *
 * const abi = [
 *   "function transfer(address to, uint256 amount) returns (bool)",
 *   "event Transfer(address indexed from, address indexed to, uint256 value)",
 *   "error InsufficientBalance(uint256 available, uint256 required)"
 * ];
 *
 * const iface = new Interface(abi);
 *
 * // Encode function call
 * const data = iface.encodeFunctionData("transfer", [
 *   "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
 *   1000000n
 * ]);
 *
 * // Decode event log
 * const log = { topics: [...], data: "0x..." };
 * const parsed = iface.parseLog(log);
 * ```
 */

// Re-export main Interface class
export { Interface } from "./Interface.js";

// Re-export Fragment classes
export {
	Fragment,
	NamedFragment,
	FunctionFragment,
	EventFragment,
	ErrorFragment,
	ConstructorFragment,
	FallbackFragment,
	ParamType,
} from "./Fragment.js";

// Re-export Description classes
export {
	LogDescription,
	TransactionDescription,
	ErrorDescription,
	Indexed,
} from "./Fragment.js";

// Re-export error classes
export {
	InterfaceError,
	FragmentNotFoundError,
	AmbiguousFragmentError,
	SignatureMismatchError,
	DecodingError,
	EncodingError,
	ArgumentCountError,
	InvalidFragmentError,
	PanicReasons,
	getPanicReason,
} from "./errors.js";

// Re-export types
export type {
	FormatType,
	AbiFunction,
	AbiEvent,
	AbiError,
	AbiConstructor,
	AbiFallback,
	AbiReceive,
	AbiItem,
	InterfaceAbi,
	IParamType,
	IFragment,
	INamedFragment,
	IFunctionFragment,
	IEventFragment,
	IErrorFragment,
	IConstructorFragment,
	IFallbackFragment,
	ILogDescription,
	ITransactionDescription,
	IErrorDescription,
	IIndexed,
	Log,
	TransactionLike,
	IInterface,
} from "./EthersInterfaceTypes.js";
