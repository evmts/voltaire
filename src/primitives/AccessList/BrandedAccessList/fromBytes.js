import { decode } from "../../Rlp/BrandedRlp/decode.js";
import { DecodingError } from "../../errors/SerializationError.js";
import { InvalidFormatError, InvalidLengthError } from "../../errors/ValidationError.js";

/**
 * Decode RLP bytes to access list (EIP-2930)
 *
 * @param {Uint8Array} bytes - RLP-encoded access list
 * @returns {import('../BrandedAccessList.js').BrandedAccessList} Decoded access list
 * @throws {DecodingError} If RLP decoding fails
 * @throws {InvalidFormatError} If structure is invalid
 * @throws {InvalidLengthError} If address or storage key length is invalid
 *
 * @example
 * ```typescript
 * const list = AccessList.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes) {
	const decoded = decode(bytes);

	if (decoded.data.type !== "list") {
		throw new InvalidFormatError("Invalid access list: expected list", {
			code: "ACCESS_LIST_NOT_LIST",
			value: decoded.data.type,
			expected: "list",
			docsPath: "/primitives/access-list",
		});
	}

	/** @type {import('../BrandedAccessList.js').BrandedAccessList} */
	const result = [];

	for (const itemData of decoded.data.value) {
		if (itemData.type !== "list" || itemData.value.length !== 2) {
			throw new InvalidFormatError(
				"Invalid access list item: expected [address, keys]",
				{
					code: "ACCESS_LIST_INVALID_ITEM_FORMAT",
					value: itemData,
					expected: "[address, storageKeys]",
					docsPath: "/primitives/access-list",
				},
			);
		}

		const addressData = itemData.value[0];
		const keysData = itemData.value[1];

		if (addressData?.type !== "bytes" || addressData.value.length !== 20) {
			throw new InvalidLengthError("Invalid access list address", {
				code: "ACCESS_LIST_INVALID_ADDRESS_LENGTH",
				value: addressData?.value,
				expected: "20 bytes",
				context: {
					actualLength: addressData?.value?.length,
					type: addressData?.type,
				},
				docsPath: "/primitives/access-list",
			});
		}

		if (keysData?.type !== "list") {
			throw new InvalidFormatError("Invalid access list storage keys", {
				code: "ACCESS_LIST_KEYS_NOT_LIST",
				value: keysData?.type,
				expected: "list",
				docsPath: "/primitives/access-list",
			});
		}

		const address = addressData.value;
		const storageKeys = [];

		for (const keyData of keysData.value) {
			if (keyData.type !== "bytes" || keyData.value.length !== 32) {
				throw new InvalidLengthError("Invalid storage key", {
					code: "ACCESS_LIST_INVALID_STORAGE_KEY_LENGTH",
					value: keyData.value,
					expected: "32 bytes",
					context: {
						actualLength: keyData.value?.length,
						type: keyData.type,
					},
					docsPath: "/primitives/access-list",
				});
			}
			storageKeys.push(keyData.value);
		}

		/** @type {any} */ const typedResult = result;
		typedResult.push({ address, storageKeys });
	}

	return result;
}
