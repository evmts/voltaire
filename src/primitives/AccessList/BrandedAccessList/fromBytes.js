import { decode } from "../../Rlp/BrandedRlp/decode.js";

/**
 * Decode RLP bytes to access list (EIP-2930)
 *
 * @param {Uint8Array} bytes - RLP-encoded access list
 * @returns {import('../BrandedAccessList.js').BrandedAccessList} Decoded access list
 *
 * @example
 * ```typescript
 * const list = AccessList.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes) {
	const decoded = decode(bytes);

	if (decoded.data.type !== "list") {
		throw new Error("Invalid access list: expected list");
	}

	/** @type {import('../BrandedAccessList.js').BrandedAccessList} */
	const result = [];

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

		const address = addressData.value;
		const storageKeys = [];

		for (const keyData of keysData.value) {
			if (keyData.type !== "bytes" || keyData.value.length !== 32) {
				throw new Error("Invalid storage key");
			}
			storageKeys.push(keyData.value);
		}

		/** @type {any} */ const typedResult = result;
		typedResult.push({ address, storageKeys });
	}

	return result;
}
