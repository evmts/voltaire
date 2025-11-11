// @ts-nocheck

/**
 * Get a specific ABI item by name and optional type
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @template {readonly import('./BrandedAbi.js').Item[]} TAbi
 * @template {string} TName
 * @template {import('./BrandedAbi.js').Item['type'] | undefined} TType
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
export function getItem(abi, name, type) {
	return abi.find(
		(item) =>
			"name" in item &&
			item.name === name &&
			(type === undefined || item.type === type),
	);
}
