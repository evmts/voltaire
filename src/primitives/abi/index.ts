/**
 * ABI (Application Binary Interface) Module
 *
 * Complete ABI encoding/decoding with type inference.
 * All types namespaced under Abi for intuitive access.
 *
 * @example
 * ```typescript
 * import { Abi } from '@tevm/voltaire';
 *
 * // Types
 * const func: Abi.Function = { type: 'function', name: 'transfer', ... };
 * const event: Abi.Event = { type: 'event', name: 'Transfer', ... };
 *
 * // Operations
 * const selector = Abi.Function.getSelector(func);
 * const topics = Abi.Event.encodeTopics(event, values);
 * ```
 */

// Export all types directly (these become Abi.Function, Abi.Event, etc.)
export * from './types.js';

// Export all error classes
export * from './errors.js';

// Export encoding/decoding utilities
export * from './encoding.js';

// Export utility functions
export * from './utils.js';

// Export namespaced operations (Abi.Function.*, Abi.Event.*, etc.)
export * as Function from './function.js';
export * as Event from './event.js';
export * as Error from './error.js';
export * as Constructor from './constructor.js';

// Export WASM variants
export * from './wasm.js';
