/**
 * CODECOPY opcode (0x39) - Copy code running in current environment to memory
 *
 * Stack: [destOffset, offset, length] => []
 * Gas: 3 (GasFastestStep) + memory expansion + copy cost
 *
 * Copies length bytes from bytecode[offset:offset+length] to memory[destOffset:destOffset+length].
 * If offset + i >= bytecode.length, remaining bytes are zero-padded.
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function codecopy(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x39_CODECOPY.d.ts.map