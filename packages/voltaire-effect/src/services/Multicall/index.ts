/**
 * @fileoverview Multicall function exports for batching contract reads.
 *
 * @module Multicall
 * @since 0.0.1
 *
 * @description
 * Exports effectful functions for batching contract reads via Multicall3.
 * These are Effect functions that depend on TransportService, not a service themselves.
 */

export { BalanceResolver } from "./BalanceResolver.js";
export { GetBalance } from "./GetBalance.js";
export {
	aggregate3,
	MULTICALL3_ADDRESS,
	type MulticallCall,
	MulticallError,
	type MulticallResult,
} from "./Multicall.js";
