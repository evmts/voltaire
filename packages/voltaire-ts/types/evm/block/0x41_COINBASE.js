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
    if (gasErr)
        return gasErr;
    // Convert coinbase address to U256 (20-byte address as big-endian number)
    let coinbaseU256 = 0n;
    if (frame.coinbase) {
        const addr = frame.coinbase;
        for (let i = 0; i < 20; i++) {
            coinbaseU256 =
                (coinbaseU256 << 8n) | BigInt(/** @type {number} */ (addr[i]));
        }
    }
    const pushErr = pushStack(frame, coinbaseU256);
    if (pushErr)
        return pushErr;
    frame.pc += 1;
    return null;
}
