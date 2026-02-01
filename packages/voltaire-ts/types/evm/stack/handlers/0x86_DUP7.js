import { FastestStep } from "../../../primitives/GasConstants/constants.js";
import { consumeGas } from "../../Frame/consumeGas.js";
import { pushStack } from "../../Frame/pushStack.js";
/**
 * DUP7 opcode (0x86) - Duplicate 7th stack item
 *
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x86_DUP7(frame) {
    const gasErr = consumeGas(frame, FastestStep);
    if (gasErr)
        return gasErr;
    if (frame.stack.length < 7) {
        return { type: "StackUnderflow" };
    }
    const value = /** @type {bigint} */ (frame.stack[frame.stack.length - 7]);
    const pushErr = pushStack(frame, value);
    if (pushErr)
        return pushErr;
    frame.pc += 1;
    return null;
}
