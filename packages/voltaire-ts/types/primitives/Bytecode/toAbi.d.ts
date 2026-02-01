/**
 * Extract ABI from bytecode by analyzing function dispatchers and event patterns
 *
 * Detects:
 * - Function selectors from PUSH4 + EQ dispatcher patterns
 * - Event hashes from PUSH32 + LOG patterns
 * - Payability from CALLVALUE checks
 * - State mutability from SLOAD/SSTORE usage
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} bytecode - Bytecode to analyze
 * @returns {import('./BytecodeType.js').BrandedAbi} Extracted ABI with function selectors and event hashes
 *
 * @example
 * ```typescript
 * const bytecode = Bytecode.fromHex("0x608060...");
 * const abi = toAbi(bytecode);
 * // [
 * //   { type: "function", selector: "0xa9059cbb", stateMutability: "nonpayable", payable: false },
 * //   { type: "event", hash: "0xddf252ad..." }
 * // ]
 * ```
 */
export function toAbi(bytecode: import("./BytecodeType.js").BrandedBytecode): import("./BytecodeType.js").BrandedAbi;
//# sourceMappingURL=toAbi.d.ts.map