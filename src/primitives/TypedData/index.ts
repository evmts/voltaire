import { encode as encodeImpl } from "./encode.js";
import { from as fromImpl } from "./from.js";
import { hash as hashImpl } from "./hash.js";
import { validate as validateImpl } from "./validate.js";

export type { TypedDataType, TypedDataField } from "./TypedDataType.js";
export * from "./errors.js";

// Internal exports (prefixed with _)
export { from as _from } from "./from.js";
export { hash as _hash } from "./hash.js";
export { encode as _encode } from "./encode.js";
export { validate as _validate } from "./validate.js";

// Public wrapper functions
export function from<T = Record<string, unknown>>(typedData: {
	types: {
		EIP712Domain: readonly import("./TypedDataType.js").TypedDataField[];
		[key: string]: readonly import("./TypedDataType.js").TypedDataField[];
	};
	primaryType: string;
	domain: {
		name?: string;
		version?: string;
		chainId?: import("../ChainId/ChainIdType.js").ChainIdType | number;
		verifyingContract?:
			| import("../Address/AddressType.js").AddressType
			| string;
		salt?: import("../Hash/HashType.js").HashType | string;
	};
	message: T;
}): import("./TypedDataType.js").TypedDataType<T> {
	return fromImpl(typedData);
}

export function hash(
	typedData: import("./TypedDataType.js").TypedDataType,
	crypto: {
		keccak256: (data: Uint8Array) => Uint8Array;
	},
): import("../Hash/HashType.js").HashType {
	return hashImpl(typedData, crypto);
}

export function encode(
	typedData: import("./TypedDataType.js").TypedDataType,
	crypto: {
		keccak256: (data: Uint8Array) => Uint8Array;
	},
): Uint8Array {
	return encodeImpl(typedData, crypto);
}

export function validate(
	typedData: import("./TypedDataType.js").TypedDataType,
): void {
	return validateImpl(typedData);
}
