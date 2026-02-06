/**
 * Calculate memory expansion cost
 *
 * EVM memory cost formula: 3n + n²/512 where n is word count
 *
 * @param {import("./FrameType.js").BrandedFrame} frame - Frame instance
 * @param {number} endBytes - Target memory size in bytes
 * @returns {bigint} Additional gas cost for expansion
 */
export function memoryExpansionCost(frame: import("./FrameType.js").BrandedFrame, endBytes: number): bigint;
//# sourceMappingURL=memoryExpansionCost.d.ts.map