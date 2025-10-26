/**
 * WASM implementation of EVM bytecode operations
 * Uses WebAssembly bindings to Zig implementation
 */
/**
 * Jump destination found in bytecode
 */
export interface JumpDestination {
    /** Position in bytecode */
    position: number;
    /** Whether this is a valid JUMPDEST opcode */
    valid: boolean;
}
/**
 * Analyze bytecode to find all valid JUMPDEST locations
 * @param code - EVM bytecode
 * @returns Array of JUMPDEST positions
 */
export declare function analyzeJumpDestinations(code: Uint8Array): JumpDestination[];
/**
 * Check if a position is at a bytecode boundary (not inside PUSH data)
 * @param code - EVM bytecode
 * @param position - Position to check
 * @returns true if position is a valid instruction boundary
 */
export declare function isBytecodeBoundary(code: Uint8Array, position: number): boolean;
/**
 * Check if a position is a valid JUMPDEST
 * @param code - EVM bytecode
 * @param position - Position to check
 * @returns true if position contains a valid JUMPDEST opcode
 */
export declare function isValidJumpDest(code: Uint8Array, position: number): boolean;
/**
 * Validate bytecode for basic correctness
 * Checks that PUSH instructions have enough data bytes
 * @param code - EVM bytecode
 * @throws Error if bytecode is invalid
 */
export declare function validateBytecode(code: Uint8Array): void;
//# sourceMappingURL=bytecode.wasm.d.ts.map