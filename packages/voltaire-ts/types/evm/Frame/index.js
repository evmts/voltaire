import { consumeGas as _consumeGas } from "./consumeGas.js";
// Internal imports
import { from as _from } from "./from.js";
import { memoryExpansionCost as _memoryExpansionCost } from "./memoryExpansionCost.js";
import { peekStack as _peekStack } from "./peekStack.js";
import { popStack as _popStack } from "./popStack.js";
import { pushStack as _pushStack } from "./pushStack.js";
import { readMemory as _readMemory } from "./readMemory.js";
import { writeMemory as _writeMemory } from "./writeMemory.js";
export { consumeGas, consumeGas as _consumeGas } from "./consumeGas.js";
// Direct exports (for internal EVM module consumers)
// Internal exports for tree-shaking (underscore prefix)
export { from, from as _from } from "./from.js";
export { memoryExpansionCost, memoryExpansionCost as _memoryExpansionCost, } from "./memoryExpansionCost.js";
export { peekStack, peekStack as _peekStack } from "./peekStack.js";
export { popStack, popStack as _popStack } from "./popStack.js";
export { pushStack, pushStack as _pushStack } from "./pushStack.js";
export { readMemory, readMemory as _readMemory } from "./readMemory.js";
export { writeMemory, writeMemory as _writeMemory } from "./writeMemory.js";
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
export function Frame(params = {}) {
    return _from(params);
}
// Attach methods to Frame function
Frame.from = _from;
Frame.pushStack = _pushStack;
Frame.popStack = _popStack;
Frame.peekStack = _peekStack;
Frame.consumeGas = _consumeGas;
Frame.readMemory = _readMemory;
Frame.writeMemory = _writeMemory;
Frame.memoryExpansionCost = _memoryExpansionCost;
// Default export
export default Frame;
