import { QuickStep } from "../../primitives/GasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";
/**
 * BASEFEE opcode (0x48) - Get base fee per gas (EIP-3198, London+)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x48_BASEFEE(frame) {
    const gasErr = consumeGas(frame, QuickStep);
    if (gasErr)
        return gasErr;
    // Use block context base fee (EIP-1559, London+)
    const baseFee = frame.blockBaseFee ?? 0n;
    const pushErr = pushStack(frame, baseFee);
    if (pushErr)
        return pushErr;
    frame.pc += 1;
    return null;
}
