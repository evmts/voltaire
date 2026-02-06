import { FastStep } from "../../primitives/GasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * SELFBALANCE opcode (0x47) - Get balance of currently executing account (EIP-1884, Istanbul+)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x47_SELFBALANCE(frame) {
	const gasErr = consumeGas(frame, FastStep);
	if (gasErr) return gasErr;

	// Use selfBalance from block context (balance of executing account)
	// Note: selfBalance should be set by the caller/host, not frame.value (call value)
	const balance = frame.selfBalance ?? 0n;

	const pushErr = pushStack(frame, balance);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
