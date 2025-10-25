/**
 * Bytecode analysis and validation utilities for EVM bytecode.
 * Provides jump destination analysis and bytecode boundary checking.
 */

import { hexToBytes } from "../utils/hex";

export interface JumpDestination {
	position: number;
	valid: boolean;
}

const JUMPDEST = 0x5b;
const PUSH1 = 0x60;
const PUSH32 = 0x7f;

function toBytes(bytecode: Uint8Array | string): Uint8Array {
	return typeof bytecode === "string" ? hexToBytes(bytecode) : bytecode;
}

/**
 * Analyze bytecode to find all valid JUMPDEST positions
 * @param bytecode - The EVM bytecode as a Uint8Array or hex string
 * @returns Array of valid jump destinations with their positions
 */
export function analyzeJumpDestinations(
	bytecode: Uint8Array | string,
): JumpDestination[] {
	const bytes = toBytes(bytecode);
	const destinations: JumpDestination[] = [];

	let i = 0;
	while (i < bytes.length) {
		const opcode = bytes[i];

		// Check if this is a JUMPDEST
		if (opcode === JUMPDEST) {
			destinations.push({ position: i, valid: true });
			i++;
			continue;
		}

		// Check if this is a PUSH instruction
		if (opcode >= PUSH1 && opcode <= PUSH32) {
			const pushSize = opcode - PUSH1 + 1;
			// Skip past the push data
			i += 1 + pushSize;
			continue;
		}

		// Regular opcode
		i++;
	}

	return destinations;
}

/**
 * Validate EVM bytecode structure
 * @param bytecode - The bytecode to validate
 * @returns true if bytecode is valid, false otherwise
 */
export function validateBytecode(bytecode: Uint8Array | string): boolean {
	const bytes = toBytes(bytecode);

	let i = 0;
	while (i < bytes.length) {
		const opcode = bytes[i];

		// Check if this is a PUSH instruction
		if (opcode >= PUSH1 && opcode <= PUSH32) {
			const pushSize = opcode - PUSH1 + 1;
			// Check if there's enough data
			if (i + pushSize >= bytes.length) {
				return false; // Truncated PUSH
			}
			i += 1 + pushSize;
			continue;
		}

		// Regular opcode
		i++;
	}

	return true;
}

/**
 * Check if a position in bytecode is at an opcode boundary (not in the middle of PUSH data)
 * @param bytecode - The bytecode
 * @param position - The position to check
 * @returns true if position is at an opcode boundary
 */
export function isBytecodeBoundary(
	bytecode: Uint8Array,
	position: number,
): boolean {
	if (position >= bytecode.length) {
		return false;
	}

	let i = 0;
	while (i < bytecode.length) {
		// If we reached the position, it's a boundary
		if (i === position) {
			return true;
		}

		// If we passed it, it's not a boundary
		if (i > position) {
			return false;
		}

		const opcode = bytecode[i];

		// Check if this is a PUSH instruction
		if (opcode >= PUSH1 && opcode <= PUSH32) {
			const pushSize = opcode - PUSH1 + 1;
			i += 1 + pushSize;
			continue;
		}

		// Regular opcode
		i++;
	}

	return false;
}

/**
 * Check if a position is a valid JUMPDEST
 * @param bytecode - The bytecode
 * @param position - The position to check
 * @returns true if position is a valid JUMPDEST
 */
export function isValidJumpDest(
	bytecode: Uint8Array,
	position: number,
): boolean {
	// Check bounds
	if (position >= bytecode.length) {
		return false;
	}

	// Check if position is at a bytecode boundary
	if (!isBytecodeBoundary(bytecode, position)) {
		return false;
	}

	// Check if the byte at position is JUMPDEST
	return bytecode[position] === JUMPDEST;
}
