/**
 * RETURNDATACOPY opcode (0x3e) - Copy output data from the previous call to memory
 *
 * Stack: [destOffset, offset, length] => []
 * Gas: 3 (GasFastestStep) + memory expansion + copy cost
 *
 * EIP-211: Introduced in Byzantium hardfork
 * Copies length bytes from returnData[offset:offset+length] to memory[destOffset:destOffset+length].
 * Throws OutOfBounds if offset + length > returnData.length.
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function returndatacopy(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x3e_RETURNDATACOPY.d.ts.map