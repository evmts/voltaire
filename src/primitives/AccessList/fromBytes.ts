import type { Address } from "../Address/index.js";
import type { Hash } from "../Hash/index.js";
import * as Rlp from "../Rlp/index.js";
import type { BrandedAccessList, Item } from "./BrandedAccessList.js";

/**
 * Decode RLP bytes to access list
 *
 * @param bytes - RLP-encoded access list
 * @returns Decoded access list
 *
 * @example
 * ```typescript
 * const list = AccessList.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes: Uint8Array): BrandedAccessList {
	const decoded = Rlp.decode.call(bytes);

	if (decoded.data.type !== "list") {
		throw new Error("Invalid access list: expected list");
	}

	const result: Item[] = [];

	for (const itemData of decoded.data.value) {
		if (itemData.type !== "list" || itemData.value.length !== 2) {
			throw new Error("Invalid access list item: expected [address, keys]");
		}

		const addressData = itemData.value[0];
		const keysData = itemData.value[1];

		if (addressData?.type !== "bytes" || addressData.value.length !== 20) {
			throw new Error("Invalid access list address");
		}

		if (keysData?.type !== "list") {
			throw new Error("Invalid access list storage keys");
		}

		const address = addressData.value as Address;
		const storageKeys: Hash[] = [];

		for (const keyData of keysData.value) {
			if (keyData.type !== "bytes" || keyData.value.length !== 32) {
				throw new Error("Invalid storage key");
			}
			storageKeys.push(keyData.value as Hash);
		}

		result.push({ address, storageKeys });
	}

	return result as BrandedAccessList;
}
