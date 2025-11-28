// Type exports
export type { BrandedFrame, EvmError } from "./FrameType.js";

// Internal imports
import { from as _from } from "./from.js";
import { pushStack as _pushStack } from "./pushStack.js";
import { popStack as _popStack } from "./popStack.js";
import { peekStack as _peekStack } from "./peekStack.js";
import { consumeGas as _consumeGas } from "./consumeGas.js";
import { readMemory as _readMemory } from "./readMemory.js";
import { writeMemory as _writeMemory } from "./writeMemory.js";
import { memoryExpansionCost as _memoryExpansionCost } from "./memoryExpansionCost.js";
import type { BrandedFrame } from "./FrameType.js";

// Direct exports (for internal EVM module consumers)
export { from } from "./from.js";
export { pushStack } from "./pushStack.js";
export { popStack } from "./popStack.js";
export { peekStack } from "./peekStack.js";
export { consumeGas } from "./consumeGas.js";
export { readMemory } from "./readMemory.js";
export { writeMemory } from "./writeMemory.js";
export { memoryExpansionCost } from "./memoryExpansionCost.js";

// Internal exports for tree-shaking (underscore prefix)
export { from as _from } from "./from.js";
export { pushStack as _pushStack } from "./pushStack.js";
export { popStack as _popStack } from "./popStack.js";
export { peekStack as _peekStack } from "./peekStack.js";
export { consumeGas as _consumeGas } from "./consumeGas.js";
export { readMemory as _readMemory } from "./readMemory.js";
export { writeMemory as _writeMemory } from "./writeMemory.js";
export { memoryExpansionCost as _memoryExpansionCost } from "./memoryExpansionCost.js";

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
export function Frame(params: FrameParams = {}): BrandedFrame {
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
