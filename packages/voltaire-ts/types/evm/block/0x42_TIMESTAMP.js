import { QuickStep } from "../../primitives/GasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";
/**
 * TIMESTAMP opcode (0x42) - Get block timestamp
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x42_TIMESTAMP(frame) {
    const gasErr = consumeGas(frame, QuickStep);
    if (gasErr)
        return gasErr;
    // Use block context timestamp (required for deterministic execution)
    // Defaults to 0 if not set - callers should provide blockTimestamp
    const timestamp = frame.blockTimestamp ?? 0n;
    const pushErr = pushStack(frame, timestamp);
    if (pushErr)
        return pushErr;
    frame.pc += 1;
    return null;
}
