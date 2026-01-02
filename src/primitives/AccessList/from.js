import { InvalidFormatError, InvalidLengthError } from "../errors/index.js";
import { fromBytes } from "./fromBytes.js";

/**
 * Create AccessList from array or bytes (EIP-2930)
 *
 * @see https://voltaire.tevm.sh/primitives/accesslist
 * @since 0.0.0
 * @param {readonly import('./AccessListType.js').Item[] | Uint8Array} value - AccessList items or RLP bytes
 * @returns {import('./AccessListType.js').BrandedAccessList} AccessList
 * @throws {InvalidFormatError} If structure is invalid
 * @throws {InvalidLengthError} If address or storage key length is invalid
 * @example
 * ```javascript
 * import * as AccessList from './primitives/AccessList/index.js';
 * const list = AccessList.from([{ address: addr, storageKeys: [key] }]);
 * const list2 = AccessList.from(bytes); // from RLP bytes
 * ```
 */
export function from(value) {
	if (value instanceof Uint8Array) {
		return fromBytes(value);
	}

	// Validate array structure
	if (!Array.isArray(value)) {
		throw new InvalidFormatError("Access list must be an array", {
			code: "ACCESS_LIST_INVALID_FORMAT",
			value: value,
			expected: "array",
			docsPath: "/primitives/access-list",
		});
	}

	for (const item of value) {
		// Validate item structure
		if (
			!item ||
			typeof item !== "object" ||
			!("address" in item) ||
			!("storageKeys" in item)
		) {
			throw new InvalidFormatError("Invalid access list item", {
				code: "ACCESS_LIST_INVALID_ITEM",
				value: item,
				expected: "{ address: Uint8Array(20), storageKeys: Uint8Array(32)[] }",
				docsPath: "/primitives/access-list",
			});
		}

		// Validate address is 20 bytes
		if (!(item.address instanceof Uint8Array) || item.address.length !== 20) {
			throw new InvalidLengthError("Invalid address in access list", {
				code: "ACCESS_LIST_INVALID_ADDRESS_LENGTH",
				value: item.address,
				expected: "20 bytes",
				context: { actualLength: item.address?.length },
				docsPath: "/primitives/access-list",
			});
		}

		// Validate storage keys array
		if (!Array.isArray(item.storageKeys)) {
			throw new InvalidFormatError("Storage keys must be an array", {
				code: "ACCESS_LIST_INVALID_STORAGE_KEYS",
				value: item.storageKeys,
				expected: "Uint8Array(32)[]",
				docsPath: "/primitives/access-list",
			});
		}

		// Validate each storage key is exactly 32 bytes
		for (const key of item.storageKeys) {
			if (!(key instanceof Uint8Array) || key.length !== 32) {
				throw new InvalidLengthError(
					"Storage key must be exactly 32 bytes",
					{
						code: "ACCESS_LIST_INVALID_STORAGE_KEY_LENGTH",
						value: key,
						expected: "32 bytes",
						context: {
							actualLength: key instanceof Uint8Array ? key.length : undefined,
							actualType: typeof key,
						},
						docsPath: "/primitives/access-list",
					},
				);
			}
		}
	}

	return value;
}
