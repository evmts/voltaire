// @ts-nocheck
import { keccak256 as keccak256Impl, keccak256String as keccak256StringImpl, } from "../../Hash/index.js";
import { decodeLog } from "./decodeLog.js";
import { EncodeTopics } from "./encodeTopics.js";
import { GetSelector } from "./getSelector.js";
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
const getSelector = GetSelector({ keccak256String: keccak256StringImpl });
const encodeTopics = EncodeTopics({
    keccak256: keccak256Impl,
    keccak256String: keccak256StringImpl,
});
// Static utility methods
export const Event = {
    getSignature,
    getSelector,
    encodeTopics,
    decodeLog,
    // Constructor-style aliases
    Signature: getSignature,
    Topics: encodeTopics,
    DecodeLog: decodeLog,
    // Factories
    GetSelector,
    EncodeTopics,
};
