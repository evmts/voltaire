import { consumeGas } from "../../Frame/consumeGas.js";
import { pushStack } from "../../Frame/pushStack.js";
import { FastestStep } from "../../../primitives/GasConstants/BrandedGasConstants/constants.js";

/**
 * Read immediate data from bytecode for PUSH operations
 *
 * @param {Uint8Array} bytecode - Bytecode
 * @param {number} pc - Program counter
 * @param {number} size - Number of bytes to read
 * @returns {bigint | null} Value or null if out of bounds
 */
function readImmediate(bytecode, pc, size) {
	// Check if we have enough bytes: current position + 1 (opcode) + size
	if (pc + 1 + size > bytecode.length) {
		return null;
	}

	let result = 0n;
	for (let i = 0; i < size; i++) {
		result = (result << 8n) | BigInt(bytecode[pc + 1 + i]);
	}
	return result;
}

/**
 * PUSH19 opcode (0x72) - Push 19 bytes onto stack
 *
 * @param {import("../../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x72_PUSH19(frame) {
	const gasErr = consumeGas(frame, FastestStep);
	if (gasErr) return gasErr;

	const value = readImmediate(frame.bytecode, frame.pc, 19);
	if (value === null) {
		return { type: "InvalidOpcode" };
	}

	const pushErr = pushStack(frame, value);
	if (pushErr) return pushErr;

	frame.pc += 20; // 1 for opcode + 19 for data
	return null;
}
