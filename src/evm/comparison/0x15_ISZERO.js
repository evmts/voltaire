import { FastestStep } from "../../primitives/GasConstants/BrandedGasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * ISZERO opcode (0x15) - Check if value is zero
 *
 * Pops one value from stack and pushes 1 if it is zero, 0 otherwise.
 *
 * Gas: 3 (GasFastestStep)
 * Stack: a -> (a == 0 ? 1 : 0)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Execution frame
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handle(frame) {
	// Consume gas
	const gasErr = consumeGas(frame, FastestStep);
	if (gasErr) return gasErr;

	// Pop operand
	const aResult = popStack(frame);
	if (aResult.error) return aResult.error;
	const a = aResult.value;

	// Check if zero
	const result = a === 0n ? 1n : 0n;

	// Push result
	const pushErr = pushStack(frame, result);
	if (pushErr) return pushErr;

	// Increment PC
	frame.pc += 1;
	return null;
}
