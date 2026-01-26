/**
 * @fileoverview Multicall service exports.
 *
 * @module Multicall
 * @since 0.0.1
 */

export { DefaultMulticall } from "./DefaultMulticall.js";
export {
	type MulticallCall,
	MulticallError,
	type MulticallResult,
	MulticallService,
	type MulticallShape,
} from "./MulticallService.js";
export { BalanceResolver } from "./BalanceResolver.js";
export { GetBalance } from "./GetBalance.js";
