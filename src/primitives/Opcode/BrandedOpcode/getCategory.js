// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Get opcode category
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to query
 * @returns {string} Category name
 *
 * @example
 * ```typescript
 * Opcode.getCategory(Opcode.ADD); // "arithmetic"
 * Opcode.getCategory(Opcode.SSTORE); // "storage"
 * Opcode.getCategory(Opcode.CALL); // "system"
 * ```
 */
export function getCategory(opcode) {
	// Stop and Arithmetic
	if (
		opcode === constants.STOP ||
		(opcode >= constants.ADD && opcode <= constants.SIGNEXTEND)
	) {
		return opcode === constants.STOP ? "control" : "arithmetic";
	}

	// Comparison & Bitwise Logic
	if (opcode >= constants.LT && opcode <= constants.SAR) {
		return "logic";
	}

	// Crypto
	if (opcode === constants.KECCAK256) {
		return "crypto";
	}

	// Environmental Information
	if (opcode >= constants.ADDRESS && opcode <= constants.EXTCODEHASH) {
		return "environment";
	}

	// Block Information
	if (opcode >= constants.BLOCKHASH && opcode <= constants.BLOBBASEFEE) {
		return "block";
	}

	// Stack, Memory, Storage and Flow
	if (opcode >= constants.POP && opcode <= constants.PUSH0) {
		if (opcode === constants.POP) return "stack";
		if (opcode >= constants.MLOAD && opcode <= constants.MSTORE8)
			return "memory";
		if (
			opcode === constants.SLOAD ||
			opcode === constants.SSTORE ||
			opcode === constants.TLOAD ||
			opcode === constants.TSTORE
		)
			return "storage";
		if (
			opcode === constants.JUMP ||
			opcode === constants.JUMPI ||
			opcode === constants.JUMPDEST
		)
			return "control";
		if (opcode === constants.MCOPY) return "memory";
		if (opcode === constants.PUSH0) return "stack";
		return "stack";
	}

	// PUSH1-PUSH32
	if (opcode >= constants.PUSH1 && opcode <= constants.PUSH32) {
		return "stack";
	}

	// DUP1-DUP16
	if (opcode >= constants.DUP1 && opcode <= constants.DUP16) {
		return "stack";
	}

	// SWAP1-SWAP16
	if (opcode >= constants.SWAP1 && opcode <= constants.SWAP16) {
		return "stack";
	}

	// LOG0-LOG4
	if (opcode >= constants.LOG0 && opcode <= constants.LOG4) {
		return "log";
	}

	// System Operations
	if (
		opcode >= constants.CREATE ||
		opcode === constants.CALL ||
		opcode === constants.CALLCODE ||
		opcode === constants.RETURN ||
		opcode === constants.DELEGATECALL ||
		opcode === constants.CREATE2 ||
		opcode === constants.AUTH ||
		opcode === constants.AUTHCALL ||
		opcode === constants.STATICCALL ||
		opcode === constants.REVERT ||
		opcode === constants.INVALID ||
		opcode === constants.SELFDESTRUCT
	) {
		return "system";
	}

	return "unknown";
}
