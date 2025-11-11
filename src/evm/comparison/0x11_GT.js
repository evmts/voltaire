import { FastestStep } from "../../primitives/GasConstants/BrandedGasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * GT opcode (0x11) - Greater than comparison (unsigned)
 *
 * Pops two values from stack and pushes 1 if first > second, 0 otherwise.
 * All comparisons are unsigned 256-bit integers.
 *
 * Gas: 3 (GasFastestStep)
 * Stack: a b -> (a > b ? 1 : 0)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Execution frame
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handle(frame) {
	// Consume gas
	const gasErr = consumeGas(frame, FastestStep);
	if (gasErr) return gasErr;

	// Pop operands (b is top, a is second)
	const bResult = popStack(frame);
	if (bResult.error) return bResult.error;
	const b = bResult.value;

	const aResult = popStack(frame);
	if (aResult.error) return aResult.error;
	const a = aResult.value;

	// Compare: a > b
	const result = a > b ? 1n : 0n;

	// Push result
	const pushErr = pushStack(frame, result);
	if (pushErr) return pushErr;

	// Increment PC
	frame.pc += 1;
	return null;
}
