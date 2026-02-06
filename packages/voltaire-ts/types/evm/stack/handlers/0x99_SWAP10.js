import { FastestStep } from "../../../primitives/GasConstants/constants.js";
import { consumeGas } from "../../Frame/consumeGas.js";
/**
 * SWAP10 opcode (0x99) - Swap top with (10+1)th item
 *
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x99_SWAP10(frame) {
    const gasErr = consumeGas(frame, FastestStep);
    if (gasErr)
        return gasErr;
    if (frame.stack.length <= 10) {
        return { type: "StackUnderflow" };
    }
    const topIdx = frame.stack.length - 1;
    const swapIdx = frame.stack.length - 1 - 10;
    const temp = /** @type {bigint} */ (frame.stack[topIdx]);
    frame.stack[topIdx] = /** @type {bigint} */ (frame.stack[swapIdx]);
    frame.stack[swapIdx] = temp;
    frame.pc += 1;
    return null;
}
