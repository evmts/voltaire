import { FastestStep } from "../../primitives/GasConstants/BrandedGasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";
import { pushStack } from "../Frame/pushStack.js";
import { toSigned256 } from "./toSigned256.js";

/**
 * SGT opcode (0x13) - Signed greater than comparison
 *
 * Pops two values from stack and pushes 1 if first > second (signed), 0 otherwise.
 * Values are interpreted as signed 256-bit two's complement integers.
 *
 * Gas: 3 (GasFastestStep)
 * Stack: a b -> (signed(a) > signed(b) ? 1 : 0)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Execution frame
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handle(frame) {
	// Consume gas
	const gasErr = consumeGas(frame, FastestStep);
	if (gasErr) return gasErr;

	// Pop operands
	const aResult = popStack(frame);
	if (aResult.error) return aResult.error;
	const a = aResult.value;

	const bResult = popStack(frame);
	if (bResult.error) return bResult.error;
	const b = bResult.value;

	// Convert to signed and compare
	const aSigned = toSigned256(a);
	const bSigned = toSigned256(b);
	const result = aSigned > bSigned ? 1n : 0n;

	// Push result
	const pushErr = pushStack(frame, result);
	if (pushErr) return pushErr;

	// Increment PC
	frame.pc += 1;
	return null;
}
