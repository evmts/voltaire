import { QuickStep } from "../../primitives/GasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";
import { ISTANBUL, isAtLeast } from "../../primitives/Hardfork/index.js";

/**
 * CHAINID opcode (0x46) - Get chain ID (EIP-1344, Istanbul+)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x46_CHAINID(frame) {
	if (frame.hardfork && !isAtLeast(frame.hardfork, ISTANBUL)) {
		return { type: "InvalidOpcode" };
	}
	const gasErr = consumeGas(frame, QuickStep);
	if (gasErr) return gasErr;

	// Use chain ID from block context (defaults to 1 = mainnet)
	const chainId = frame.chainId ?? 1n;

	const pushErr = pushStack(frame, chainId);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
