import { FastestStep } from "../../../primitives/GasConstants/constants.js";
import { consumeGas } from "../../Frame/consumeGas.js";
/**
 * SWAP2 opcode (0x91) - Swap top with (2+1)th item
 *
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x91_SWAP2(frame) {
    const gasErr = consumeGas(frame, FastestStep);
    if (gasErr)
        return gasErr;
    if (frame.stack.length <= 2) {
        return { type: "StackUnderflow" };
    }
    const topIdx = frame.stack.length - 1;
    const swapIdx = frame.stack.length - 1 - 2;
    const temp = /** @type {bigint} */ (frame.stack[topIdx]);
    frame.stack[topIdx] = /** @type {bigint} */ (frame.stack[swapIdx]);
    frame.stack[swapIdx] = temp;
    frame.pc += 1;
    return null;
}
