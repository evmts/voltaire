/**
 * Creates an OpStep from raw data
 *
 * @param {object} data - OpStep data
 * @param {number} data.pc - Program counter
 * @param {import('../Opcode/OpcodeType.js').OpcodeType} data.op - Opcode
 * @param {import('../Uint/Uint256Type.js').Uint256Type} data.gas - Remaining gas
 * @param {import('../Uint/Uint256Type.js').Uint256Type} data.gasCost - Gas cost
 * @param {number} data.depth - Call depth
 * @param {readonly import('../Uint/Uint256Type.js').Uint256Type[]} [data.stack] - Stack state
 * @param {Uint8Array} [data.memory] - Memory state
 * @param {Record<string, import('../Uint/Uint256Type.js').Uint256Type>} [data.storage] - Storage changes
 * @param {string} [data.error] - Error message
 * @returns {import('./OpStepType.js').OpStepType} OpStep instance
 * @example
 * ```javascript
 * import { from } from './from.js';
 * const step = from({ pc: 0, op: 0x60, gas: 1000000n, gasCost: 3n, depth: 0 });
 * ```
 */
export function from(data: {
    pc: number;
    op: import("../Opcode/OpcodeType.js").OpcodeType;
    gas: import("../Uint/Uint256Type.js").Uint256Type;
    gasCost: import("../Uint/Uint256Type.js").Uint256Type;
    depth: number;
    stack?: readonly import("../Uint/Uint256Type.js").Uint256Type[] | undefined;
    memory?: Uint8Array<ArrayBufferLike> | undefined;
    storage?: Record<string, import("../Uint/Uint256Type.js").Uint256Type> | undefined;
    error?: string | undefined;
}): import("./OpStepType.js").OpStepType;
//# sourceMappingURL=from.d.ts.map