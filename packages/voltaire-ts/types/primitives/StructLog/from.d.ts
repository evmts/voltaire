/**
 * Creates a StructLog from raw data
 *
 * @param {object} data - StructLog data
 * @param {number} data.pc - Program counter
 * @param {string} data.op - Opcode name
 * @param {import('../Uint/Uint256Type.js').Uint256Type} data.gas - Remaining gas
 * @param {import('../Uint/Uint256Type.js').Uint256Type} data.gasCost - Gas cost
 * @param {number} data.depth - Call depth
 * @param {readonly string[]} data.stack - Stack as hex strings
 * @param {readonly string[]} [data.memory] - Memory as hex chunks
 * @param {Record<string, string>} [data.storage] - Storage changes
 * @param {import('../Uint/Uint256Type.js').Uint256Type} [data.refund] - Gas refund
 * @param {string} [data.error] - Error message
 * @returns {import('./StructLogType.js').StructLogType} StructLog instance
 * @example
 * ```javascript
 * import { from } from './from.js';
 * const log = from({
 *   pc: 0,
 *   op: "PUSH1",
 *   gas: 1000000n,
 *   gasCost: 3n,
 *   depth: 0,
 *   stack: ["0x60"]
 * });
 * ```
 */
export function from(data: {
    pc: number;
    op: string;
    gas: import("../Uint/Uint256Type.js").Uint256Type;
    gasCost: import("../Uint/Uint256Type.js").Uint256Type;
    depth: number;
    stack: readonly string[];
    memory?: readonly string[] | undefined;
    storage?: Record<string, string> | undefined;
    refund?: import("../Uint/Uint256Type.js").Uint256Type | undefined;
    error?: string | undefined;
}): import("./StructLogType.js").StructLogType;
//# sourceMappingURL=from.d.ts.map