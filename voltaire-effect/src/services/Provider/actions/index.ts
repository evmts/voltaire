/**
 * @fileoverview Provider actions for contract interactions.
 * @module Provider/actions
 * @since 0.0.1
 */

export {
	readContract,
	type ReadContractParams,
	type Abi,
} from "./readContract.js";

export {
	simulateContract,
	type SimulateContractParams,
	type SimulateContractResult,
	type StateOverride,
} from "./simulateContract.js";

export {
	multicall,
	type ContractCall,
	type MulticallParams,
	type MulticallResults,
} from "./multicall.js";
