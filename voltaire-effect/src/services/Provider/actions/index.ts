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
	type MulticallContract,
	type MulticallParams,
	type MulticallResult,
	type MulticallResultSuccess,
	type MulticallResultFailure,
} from "./multicall.js";
