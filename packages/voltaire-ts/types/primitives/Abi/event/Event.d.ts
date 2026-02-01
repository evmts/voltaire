export namespace Event {
    export { getSignature };
    export { getSelector };
    export { encodeTopics };
    export { decodeLog };
    export { getSignature as Signature };
    export { encodeTopics as Topics };
    export { decodeLog as DecodeLog };
    export { GetSelector };
    export { EncodeTopics };
}
import { getSignature } from "./getSignature.js";
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
declare const getSelector: (event: any) => import("../../Hash/HashType.js").HashType;
declare const encodeTopics: (event: any, args: any) => (import("../../Hash/HashType.js").HashType | null)[];
import { decodeLog } from "./decodeLog.js";
import { GetSelector } from "./getSelector.js";
import { EncodeTopics } from "./encodeTopics.js";
export {};
//# sourceMappingURL=Event.d.ts.map