/**
 * Get an item from an ABI by name and optionally by type
 * @template {readonly import('./ItemType.js').ItemType[]} TAbi
 * @template {string} TName
 * @template {import('./ItemType.js').ItemType["type"] | undefined} TType
 * @param {TAbi} abi - The ABI array
 * @param {TName} name - The item name
 * @param {TType} [type] - Optional type filter
 * @returns {any}
 */
export function getItem<TAbi extends readonly import("./ItemType.js").ItemType[], TName extends string, TType extends import("./ItemType.js").ItemType["type"] | undefined>(abi: TAbi, name: TName, type?: TType): any;
//# sourceMappingURL=getItem.d.ts.map