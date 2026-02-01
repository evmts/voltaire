/**
 * Check if opcode is valid
 *
 * @param {number} opcode - Byte value to check
 * @returns {opcode is import('./OpcodeType.js').OpcodeType} True if opcode is defined in the EVM
 *
 * @example
 * ```typescript
 * Opcode.isValid(0x01); // true (ADD)
 * Opcode.isValid(0x0c); // false (undefined)
 * ```
 */
export function isValid(opcode: number): opcode is import("./OpcodeType.js").OpcodeType;
//# sourceMappingURL=isValid.d.ts.map