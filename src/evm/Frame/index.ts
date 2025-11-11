// Type exports
export type { BrandedFrame, EvmError } from "./BrandedFrame.js";

// Internal exports (prefixed with _)
export { from as _from } from "./from.js";
export { pushStack as _pushStack } from "./pushStack.js";
export { popStack as _popStack } from "./popStack.js";
export { peekStack as _peekStack } from "./peekStack.js";
export { consumeGas as _consumeGas } from "./consumeGas.js";
export { readMemory as _readMemory } from "./readMemory.js";
export { writeMemory as _writeMemory } from "./writeMemory.js";
export { memoryExpansionCost as _memoryExpansionCost } from "./memoryExpansionCost.js";

// Re-export as Frame namespace
import type { BrandedFrame, EvmError } from "./BrandedFrame.js";
import { from as _from } from "./from.js";
import { pushStack as _pushStack } from "./pushStack.js";
import { popStack as _popStack } from "./popStack.js";
import { peekStack as _peekStack } from "./peekStack.js";
import { consumeGas as _consumeGas } from "./consumeGas.js";
import { readMemory as _readMemory } from "./readMemory.js";
import { writeMemory as _writeMemory } from "./writeMemory.js";
import { memoryExpansionCost as _memoryExpansionCost } from "./memoryExpansionCost.js";

/**
 * Frame namespace - EVM execution frame operations
 *
 * Based on guillotine-mini Frame architecture.
 */
export const Frame = {
	from: _from,
	pushStack: _pushStack,
	popStack: _popStack,
	peekStack: _peekStack,
	consumeGas: _consumeGas,
	readMemory: _readMemory,
	writeMemory: _writeMemory,
	memoryExpansionCost: _memoryExpansionCost,
} as const;
