import {
	InvalidFormatError,
	InvalidLengthError,
} from "../errors/ValidationError.js";
import type { BrandedAccessList } from "./AccessListType.js";
import { isItem } from "./isItem.js";

/**
 * Validate access list structure
 *
 * @param list - Access list to validate
 * @throws {InvalidFormatError} If invalid structure
 * @throws {InvalidLengthError} If invalid address or storage key length
 *
 * @example
 * ```typescript
 * try {
 *   AccessList.assertValid(list);
 *   console.log('Valid access list');
 * } catch (err) {
 *   console.error('Invalid:', err.message);
 * }
 * ```
 */
export function assertValid(list: BrandedAccessList): void {
	if (!Array.isArray(list)) {
		throw new InvalidFormatError("Access list must be an array", {
			code: -32602,
			value: list,
			expected: "array",
			docsPath: "/primitives/access-list",
		});
	}

	for (const item of list) {
		if (!isItem(item)) {
			throw new InvalidFormatError("Invalid access list item", {
				code: -32602,
				value: item,
				expected: "{ address: Uint8Array, storageKeys: Uint8Array[] }",
				docsPath: "/primitives/access-list",
			});
		}

		// Validate address
		if (!(item.address instanceof Uint8Array) || item.address.length !== 20) {
			throw new InvalidLengthError("Invalid address in access list", {
				code: -32602,
				value: item.address,
				expected: "20 bytes",
				context: { actualLength: item.address?.length },
				docsPath: "/primitives/access-list",
			});
		}

		// Validate storage keys
		for (const key of item.storageKeys) {
			if (!(key instanceof Uint8Array) || key.length !== 32) {
				throw new InvalidLengthError("Invalid storage key in access list", {
					code: -32602,
					value: key,
					expected: "32 bytes",
					context: { actualLength: key?.length },
					docsPath: "/primitives/access-list",
				});
			}
		}
	}
}
