import { FastestStep } from "../../../primitives/GasConstants/constants.js";
import { consumeGas } from "../../Frame/consumeGas.js";
import { pushStack } from "../../Frame/pushStack.js";
/**
 * DUP15 opcode (0x8E) - Duplicate 15th stack item
 *
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x8E_DUP15(frame) {
    const gasErr = consumeGas(frame, FastestStep);
    if (gasErr)
        return gasErr;
    if (frame.stack.length < 15) {
        return { type: "StackUnderflow" };
    }
    const value = /** @type {bigint} */ (frame.stack[frame.stack.length - 15]);
    const pushErr = pushStack(frame, value);
    if (pushErr)
        return pushErr;
    frame.pc += 1;
    return null;
}
