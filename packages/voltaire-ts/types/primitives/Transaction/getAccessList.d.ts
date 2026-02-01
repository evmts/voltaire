import type { AccessList, Any } from "./types.js";
/**
 * Get access list (empty for legacy transactions).
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @returns Transaction access list
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { getAccessList } from './primitives/Transaction/getAccessList.js';
 * const accessList = getAccessList.call(tx);
 * ```
 */
export declare function getAccessList(this: Any): AccessList;
//# sourceMappingURL=getAccessList.d.ts.map