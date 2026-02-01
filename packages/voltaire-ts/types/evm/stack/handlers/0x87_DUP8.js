import { FastestStep } from "../../../primitives/GasConstants/constants.js";
import { consumeGas } from "../../Frame/consumeGas.js";
import { pushStack } from "../../Frame/pushStack.js";
/**
 * DUP8 opcode (0x87) - Duplicate 8th stack item
 *
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x87_DUP8(frame) {
    const gasErr = consumeGas(frame, FastestStep);
    if (gasErr)
        return gasErr;
    if (frame.stack.length < 8) {
        return { type: "StackUnderflow" };
    }
    const value = /** @type {bigint} */ (frame.stack[frame.stack.length - 8]);
    const pushErr = pushStack(frame, value);
    if (pushErr)
        return pushErr;
    frame.pc += 1;
    return null;
}
