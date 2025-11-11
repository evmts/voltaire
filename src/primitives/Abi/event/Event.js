// @ts-nocheck
import * as BrandedEvent from "./BrandedEvent/index.ts";

/**
 * Factory function for creating Event instances
 * Note: Event is a plain object, not a class instance
 * This namespace provides convenient methods for working with events
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const event = {
 *   type: 'event',
 *   name: 'Transfer',
 *   inputs: [
 *     { type: 'address', name: 'from', indexed: true },
 *     { type: 'address', name: 'to', indexed: true },
 *     { type: 'uint256', name: 'value' }
 *   ]
 * };
 * const selector = Abi.Event.getSelector(event);
 * ```
 */

// Static utility methods
export const Event = {
	getSignature: BrandedEvent.getSignature,
	getSelector: BrandedEvent.getSelector,
	encodeTopics: BrandedEvent.encodeTopics,
	decodeLog: BrandedEvent.decodeLog,
};
