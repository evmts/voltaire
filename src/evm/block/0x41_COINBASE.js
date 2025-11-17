import { QuickStep } from "../../primitives/GasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * COINBASE opcode (0x41) - Get block coinbase address
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x41_COINBASE(frame) {
	const gasErr = consumeGas(frame, QuickStep);
	if (gasErr) return gasErr;

	// TODO: Access via block context when available
	// const coinbase_u256 = Address.toU256(frame.evm.block_context.block_coinbase);

	// Stub: Return zero address for now
	const coinbaseU256 = 0n;

	const pushErr = pushStack(frame, coinbaseU256);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
