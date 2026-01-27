/**
 * @fileoverview Multicall service exports.
 *
 * @module Multicall
 * @since 0.0.1
 */

export { BalanceResolver } from "./BalanceResolver.js";
export { GetBalance } from "./GetBalance.js";
export {
	aggregate3,
	MULTICALL3_ADDRESS,
	type MulticallCall,
	MulticallError,
	type MulticallResult,
} from "./MulticallService.js";
