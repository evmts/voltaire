/**
 * Get a specific ABI item by name and optional type
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @template {readonly import('./AbiType.js').Item[]} TAbi
 * @template {string} TName
 * @template {import('./AbiType.js').Item['type'] | undefined} TType
 * @param {TAbi} abi - ABI array to search
 * @param {TName} name - Name of the item to find
 * @param {TType} [type] - Optional type filter (function, event, error, constructor)
 * @returns {Extract<TAbi[number], { name: TName }> | undefined} The found item or undefined
 * @throws {never}
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const transferFn = Abi.Item.getItem(abi, 'transfer', 'function');
 * const transferEvent = Abi.Item.getItem(abi, 'Transfer', 'event');
 * ```
 */
export function getItem<TAbi extends readonly import("./AbiType.js").Item[], TName extends string, TType extends import("./AbiType.js").Item["type"] | undefined>(abi: TAbi, name: TName, type?: TType): Extract<TAbi[number], {
    name: TName;
}> | undefined;
//# sourceMappingURL=getItem.d.ts.map