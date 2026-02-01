/**
 * BYTE opcode (0x1a) - Extract byte from word
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function handle(frame) {
    // Consume gas (GasFastestStep = 3)
    frame.gasRemaining -= 3n;
    if (frame.gasRemaining < 0n) {
        frame.gasRemaining = 0n;
        return { type: "OutOfGas" };
    }
    // Pop operands
    if (frame.stack.length < 2)
        return { type: "StackUnderflow" };
    const i = frame.stack.pop();
    if (i === undefined)
        return { type: "StackUnderflow" };
    const x = frame.stack.pop();
    if (x === undefined)
        return { type: "StackUnderflow" };
    // Extract byte: if i >= 32, return 0, else get byte at position (31-i)
    const result = i >= 32n ? 0n : (x >> (8n * (31n - i))) & 0xffn;
    // Push result
    if (frame.stack.length >= 1024)
        return { type: "StackOverflow" };
    frame.stack.push(result);
    // Increment PC
    frame.pc += 1;
    return null;
}
