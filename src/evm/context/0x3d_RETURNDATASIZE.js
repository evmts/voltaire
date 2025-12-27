import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * RETURNDATASIZE opcode (0x3d) - Get size of output data from the previous call
 *
 * Stack: [] => [size]
 * Gas: 2 (GasQuickStep)
 *
 * EIP-211: Introduced in Byzantium hardfork
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function returndatasize(frame) {
	// Note: Add hardfork validation for Byzantium+
	const gasErr = consumeGas(frame, 2n);
	if (gasErr) return gasErr;

	const pushErr = pushStack(frame, BigInt(frame.returnData.length));
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
