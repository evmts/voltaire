export type { BrandedFrame, EvmError } from "./FrameType.js";
import { consumeGas as _consumeGas } from "./consumeGas.js";
import type { BrandedFrame } from "./FrameType.js";
import { from as _from } from "./from.js";
import { memoryExpansionCost as _memoryExpansionCost } from "./memoryExpansionCost.js";
import { peekStack as _peekStack } from "./peekStack.js";
import { popStack as _popStack } from "./popStack.js";
import { pushStack as _pushStack } from "./pushStack.js";
import { readMemory as _readMemory } from "./readMemory.js";
import { writeMemory as _writeMemory } from "./writeMemory.js";
export { consumeGas, consumeGas as _consumeGas } from "./consumeGas.js";
export { from, from as _from } from "./from.js";
export { memoryExpansionCost, memoryExpansionCost as _memoryExpansionCost, } from "./memoryExpansionCost.js";
export { peekStack, peekStack as _peekStack } from "./peekStack.js";
export { popStack, popStack as _popStack } from "./popStack.js";
export { pushStack, pushStack as _pushStack } from "./pushStack.js";
export { readMemory, readMemory as _readMemory } from "./readMemory.js";
export { writeMemory, writeMemory as _writeMemory } from "./writeMemory.js";
/**
 * Frame parameters for creating a new execution frame
 */
export interface FrameParams {
    bytecode?: Uint8Array;
    gas?: bigint;
    caller?: Uint8Array;
    address?: Uint8Array;
    value?: bigint;
    calldata?: Uint8Array;
    isStatic?: boolean;
    stack?: bigint[];
    gasRemaining?: bigint;
}
/**
 * Create a new EVM execution frame
 *
 * @param params - Frame initialization parameters
 * @returns New Frame instance
 * @example
 * ```typescript
 * import { Frame } from 'voltaire/evm/Frame';
 *
 * const frame = Frame({
 *   bytecode: new Uint8Array([0x60, 0x01]),
 *   gas: 100000n,
 * });
 * ```
 */
export declare function Frame(params?: FrameParams): BrandedFrame;
export declare namespace Frame {
    var from: typeof _from;
    var pushStack: typeof _pushStack;
    var popStack: typeof _popStack;
    var peekStack: typeof _peekStack;
    var consumeGas: typeof _consumeGas;
    var readMemory: typeof _readMemory;
    var writeMemory: typeof _writeMemory;
    var memoryExpansionCost: typeof _memoryExpansionCost;
}
export default Frame;
//# sourceMappingURL=index.d.ts.map