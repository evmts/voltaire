/**
 * @fileoverview Multicall service exports.
 *
 * @module Multicall
 * @since 0.0.1
 */

export { BalanceResolver } from "./BalanceResolver.js";
export { DefaultMulticall } from "./DefaultMulticall.js";
export { GetBalance } from "./GetBalance.js";
export {
	type MulticallCall,
	MulticallError,
	type MulticallResult,
	MulticallService,
	type MulticallShape,
} from "./MulticallService.js";
