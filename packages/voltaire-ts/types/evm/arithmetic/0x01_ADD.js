/**
 * ADD opcode (0x01) - Addition with overflow wrapping
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function add(frame) {
    // Consume gas (GasFastestStep = 3)
    frame.gasRemaining -= 3n;
    if (frame.gasRemaining < 0n) {
        frame.gasRemaining = 0n;
        return { type: "OutOfGas" };
    }
    // Pop operands
    if (frame.stack.length < 2)
        return { type: "StackUnderflow" };
    const a = frame.stack.pop();
    if (a === undefined)
        return { type: "StackUnderflow" };
    const b = frame.stack.pop();
    if (b === undefined)
        return { type: "StackUnderflow" };
    // Compute result with wrapping (modulo 2^256)
    const result = (a + b) & ((1n << 256n) - 1n);
    // Push result
    if (frame.stack.length >= 1024)
        return { type: "StackOverflow" };
    frame.stack.push(result);
    // Increment PC
    frame.pc += 1;
    return null;
}
